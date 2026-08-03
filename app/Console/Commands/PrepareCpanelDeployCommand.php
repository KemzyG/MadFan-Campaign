<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use SplFileInfo;
use ZipArchive;

class PrepareCpanelDeployCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:prepare-cpanel-deploy
                            {--output=storage/app/cpanel-deploy.zip : Relative path for the deploy zip}
                            {--skip-build : Skip npm run build}
                            {--with-dev : Include Composer require-dev packages in the package}';

    /**
     * @var string
     */
    protected $description = 'Build assets and package a cPanel-ready zip without mutating local vendor/';

    /**
     * @var list<string>
     */
    private array $excludedDirectories = [
        '.git',
        '.cursor',
        '.ai',
        '.continue',
        '.junie',
        '.qoder',
        'node_modules',
        'tests',
        'storage/app/cpanel-deploy',
        'storage/logs',
        'storage/framework/cache/data',
        'storage/framework/sessions',
        'storage/framework/views',
        'storage/pail',
        'vendor',
        'public/storage',
    ];

    /**
     * @var list<string>
     */
    private array $excludedFiles = [
        '.env',
        '.env.backup',
        '.env.production',
        '.phpunit.result.cache',
        'phpunit.xml',
        'auth.json',
    ];

    public function handle(): int
    {
        $basePath = base_path();
        $outputPath = $this->resolveOutputPath((string) $this->option('output'));
        // Keep staging shallow — Windows MAX_PATH breaks Composer classmaps in deep vendor trees.
        $stagingPath = rtrim(sys_get_temp_dir(), '\\/').DIRECTORY_SEPARATOR.'madfan-cpanel-stg';

        if (! $this->option('skip-build')) {
            $this->info('Building frontend assets...');
            $build = Process::path($basePath)->timeout(600)->run('npm run build');

            if ($build->failed()) {
                $this->output->write($build->output());
                $this->output->write($build->errorOutput());
                $this->error('npm run build failed. Fix the build or pass --skip-build if public/build already exists.');

                return self::FAILURE;
            }
        }

        if (! File::exists(public_path('build/manifest.json'))) {
            $this->error('public/build/manifest.json is missing. Run npm run build before packaging.');

            return self::FAILURE;
        }

        $this->info('Publishing Filament assets...');
        $filament = Process::path($basePath)->timeout(120)->run('php artisan filament:assets --no-interaction');

        if ($filament->failed()) {
            $this->output->write($filament->output());
            $this->output->write($filament->errorOutput());
            $this->error('php artisan filament:assets failed.');

            return self::FAILURE;
        }

        $this->info('Publishing Livewire assets...');
        $livewire = Process::path($basePath)->timeout(120)->run('php artisan livewire:publish --assets --no-interaction');

        if ($livewire->failed()) {
            $this->output->write($livewire->output());
            $this->output->write($livewire->errorOutput());
            $this->warn('livewire:publish --assets failed; Filament may fall back to dynamic /livewire-* routes.');
        }

        $requiredFilamentAssets = [
            'js/filament/filament/app.js',
            'css/filament/filament/app.css',
            'js/filament/schemas/schemas.js',
            'js/filament/support/support.js',
            'fonts/filament/filament/inter/inter-latin-wght-normal-NRMW37G5.woff2',
        ];

        foreach ($requiredFilamentAssets as $relative) {
            if (! File::exists(public_path($relative))) {
                $this->error("Missing required Filament asset: public/{$relative}");

                return self::FAILURE;
            }
        }

        if (File::exists($stagingPath)) {
            File::deleteDirectory($stagingPath);
        }
        File::ensureDirectoryExists($stagingPath);

        $this->info('Copying application files to staging ('.$stagingPath.')...');
        $this->copyApplicationToStaging($basePath, $stagingPath);

        $composerFlags = $this->option('with-dev')
            ? 'install --prefer-dist --optimize-autoloader --no-interaction'
            : 'install --no-dev --prefer-dist --optimize-autoloader --no-interaction';

        $this->info('Installing Composer dependencies in staging (does not change your local vendor/)...');
        $composer = Process::path($stagingPath)
            ->timeout(900)
            ->env([
                'COMPOSER_DISABLE_XDEBUG' => '1',
            ])
            ->run('composer '.$composerFlags);

        if ($composer->failed()) {
            $this->output->write($composer->output());
            $this->output->write($composer->errorOutput());
            $this->warn('Composer install in staging failed — falling back to copying local vendor/.');

            if (! File::isDirectory($basePath.DIRECTORY_SEPARATOR.'vendor')) {
                $this->error('No local vendor/ available to copy.');

                return self::FAILURE;
            }

            File::deleteDirectory($stagingPath.DIRECTORY_SEPARATOR.'vendor');
            File::copyDirectory($basePath.DIRECTORY_SEPARATOR.'vendor', $stagingPath.DIRECTORY_SEPARATOR.'vendor');
        }

        File::ensureDirectoryExists(dirname($outputPath));

        if (File::exists($outputPath)) {
            try {
                File::delete($outputPath);
            } catch (\Throwable) {
                // Destination may be locked by Explorer/AV; createZip writes via a temp file then replaces.
            }
        }

        $this->info('Creating deploy archive: '.$outputPath);

        try {
            $this->createZip($stagingPath, $outputPath);
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            if (str_contains(strtolower($exception->getMessage()), 'permission denied')) {
                $this->newLine();
                $this->warn('Windows tip: close File Explorer windows on storage/app, pause OneDrive sync for this folder,');
                $this->warn('or pass a different path, e.g. --output=C:/Users/Public/cpanel-deploy.zip');
            }

            return self::FAILURE;
        } finally {
            File::deleteDirectory($stagingPath);
        }

        $sizeMb = round(filesize($outputPath) / 1024 / 1024, 1);

        $this->newLine();
        $this->info("cPanel package ready ({$sizeMb} MB).");
        $this->line('Next steps:');
        $this->line('  1. Upload and extract the zip on the server.');
        $this->line('  2. Point the domain document root to /public (preferred), or rely on the root .htaccess shim.');
        $this->line('  3. Copy .env.cpanel.example to .env and fill production values.');
        $this->line('  4. Run bash deploy/cpanel/post-deploy.sh (or cpanel-migrate.php without SSH).');
        $this->line('  5. See deploy/cpanel/INSTRUCTIONS.txt for full cPanel steps.');

        return self::SUCCESS;
    }

    private function resolveOutputPath(string $relative): string
    {
        if (str_starts_with($relative, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\\/]/', $relative) === 1) {
            return $relative;
        }

        return base_path($relative);
    }

    private function copyApplicationToStaging(string $basePath, string $stagingPath): void
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($basePath, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST,
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            $absolute = $file->getPathname();
            $relative = ltrim(str_replace('\\', '/', substr($absolute, strlen($basePath))), '/');

            if ($this->shouldExclude($relative)) {
                continue;
            }

            $destination = $stagingPath.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative);

            // Prefer filesystem checks — Windows junctions/symlinks confuse SplFileInfo::isDir().
            if (is_dir($absolute) || $file->isDir()) {
                File::ensureDirectoryExists($destination);

                continue;
            }

            if (! is_file($absolute)) {
                continue;
            }

            File::ensureDirectoryExists(dirname($destination));
            File::copy($absolute, $destination);
        }

        foreach ([
            'storage/app/public',
            'storage/app/private',
            'storage/framework/cache',
            'storage/framework/sessions',
            'storage/framework/views',
            'storage/logs',
            'bootstrap/cache',
        ] as $directory) {
            File::ensureDirectoryExists($stagingPath.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $directory));
            File::put($stagingPath.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $directory).DIRECTORY_SEPARATOR.'.gitignore', "*\n!.gitignore\n");
        }
    }

    private function createZip(string $sourcePath, string $outputPath): void
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('PHP zip extension is required to create the deploy archive.');
        }

        // Write to a temp path first. On Windows, ZipArchive::close() renames a temp file onto
        // $outputPath and fails with "Permission denied" when Explorer/AV locks the destination.
        $tempZip = rtrim(sys_get_temp_dir(), '\\/').DIRECTORY_SEPARATOR.'madfan-cpanel-'.uniqid('', true).'.zip';

        $zip = new ZipArchive;

        if ($zip->open($tempZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Unable to create zip archive at '.$tempZip);
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($sourcePath, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST,
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            $absolute = $file->getPathname();
            $relative = ltrim(str_replace('\\', '/', substr($absolute, strlen($sourcePath))), '/');

            if ($file->isDir()) {
                $zip->addEmptyDir($relative);

                continue;
            }

            $zip->addFile($absolute, $relative);
        }

        if ($zip->close() !== true) {
            @unlink($tempZip);

            throw new RuntimeException('Unable to finalize zip archive at '.$tempZip);
        }

        File::ensureDirectoryExists(dirname($outputPath));

        if (File::exists($outputPath)) {
            File::delete($outputPath);
        }

        if (! @rename($tempZip, $outputPath)) {
            try {
                File::move($tempZip, $outputPath);
            } catch (\Throwable $exception) {
                // Last resort: copy then delete (works across drives / some locks).
                if (! @copy($tempZip, $outputPath)) {
                    @unlink($tempZip);

                    throw new RuntimeException(
                        'Unable to write zip to '.$outputPath.'. '.$exception->getMessage(),
                        0,
                        $exception,
                    );
                }

                @unlink($tempZip);
            }
        }

        if (! File::exists($outputPath)) {
            throw new RuntimeException('Deploy archive was not written to '.$outputPath);
        }
    }

    private function shouldExclude(string $relative): bool
    {
        $normalized = str_replace('\\', '/', $relative);

        if (in_array(basename($normalized), $this->excludedFiles, true)) {
            return true;
        }

        if (str_ends_with($normalized, '.zip') && str_contains($normalized, 'cpanel-deploy')) {
            return true;
        }

        foreach ($this->excludedDirectories as $excluded) {
            $excluded = str_replace('\\', '/', $excluded);

            if ($normalized === $excluded || str_starts_with($normalized, $excluded.'/')) {
                return true;
            }
        }

        return false;
    }
}
