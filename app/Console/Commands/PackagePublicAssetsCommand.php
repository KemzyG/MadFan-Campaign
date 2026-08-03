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

class PackagePublicAssetsCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:package-public-assets
                            {--output=storage/app/cpanel-public-assets.zip : Relative path for the assets zip}
                            {--skip-build : Skip npm run build}
                            {--skip-filament : Skip php artisan filament:assets}';

    /**
     * @var string
     */
    protected $description = 'Zip public/build + Filament css/js/fonts for upload to cPanel document root';

    public function handle(): int
    {
        $basePath = base_path();
        $outputPath = $this->resolveOutputPath((string) $this->option('output'));

        if (! $this->option('skip-build')) {
            $this->info('Building Vite assets...');
            $build = Process::path($basePath)->timeout(600)->run('npm run build');

            if ($build->failed()) {
                $this->output->write($build->output());
                $this->error('npm run build failed.');

                return self::FAILURE;
            }
        }

        if (! $this->option('skip-filament')) {
            $this->info('Publishing Filament assets...');
            $filament = Process::path($basePath)->timeout(120)->run('php artisan filament:assets --no-interaction');

            if ($filament->failed()) {
                $this->output->write($filament->output());
                $this->error('php artisan filament:assets failed.');

                return self::FAILURE;
            }
        }

        $required = [
            'build/manifest.json',
            'js/filament/filament/app.js',
            'css/filament/filament/app.css',
            'js/filament/schemas/schemas.js',
            'fonts/filament/filament/inter/inter-latin-wght-normal-NRMW37G5.woff2',
        ];

        foreach ($required as $relative) {
            if (! File::exists(public_path($relative))) {
                $this->error("Missing public/{$relative}");

                return self::FAILURE;
            }
        }

        File::ensureDirectoryExists(dirname($outputPath));

        if (File::exists($outputPath)) {
            File::delete($outputPath);
        }

        $this->info('Creating assets archive: '.$outputPath);
        $this->createZip(public_path(), $outputPath, [
            'build',
            'css',
            'js',
            'fonts',
            'favicon.ico',
            'favicon.jpg',
            'images',
            'robots.txt',
            '.htaccess',
            '.user.ini',
        ]);

        $sizeMb = round(filesize($outputPath) / 1024 / 1024, 1);

        $this->newLine();
        $this->info("Public assets package ready ({$sizeMb} MB).");
        $this->line('Upload and extract into your cPanel document root (public/ or public_html/).');
        $this->line('Confirm https://your-domain.com/js/filament/filament/app.js loads, then hard-refresh /admin.');

        return self::SUCCESS;
    }

    /**
     * @param  list<string>  $includes
     */
    private function createZip(string $publicPath, string $outputPath, array $includes): void
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('PHP zip extension is required.');
        }

        $zip = new ZipArchive;

        if ($zip->open($outputPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Unable to create zip at '.$outputPath);
        }

        foreach ($includes as $include) {
            $absolute = $publicPath.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $include);

            if (! File::exists($absolute)) {
                continue;
            }

            if (is_file($absolute)) {
                $zip->addFile($absolute, $include);

                continue;
            }

            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($absolute, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::SELF_FIRST,
            );

            /** @var SplFileInfo $file */
            foreach ($iterator as $file) {
                $full = $file->getPathname();
                $relative = $include.'/'.ltrim(str_replace('\\', '/', substr($full, strlen($absolute))), '/');

                if ($file->isDir()) {
                    $zip->addEmptyDir(rtrim($relative, '/'));

                    continue;
                }

                $zip->addFile($full, $relative);
            }
        }

        $zip->close();
    }

    private function resolveOutputPath(string $relative): string
    {
        if (str_starts_with($relative, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\\/]/', $relative) === 1) {
            return $relative;
        }

        return base_path($relative);
    }
}
