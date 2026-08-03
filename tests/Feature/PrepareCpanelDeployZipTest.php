<?php

use App\Console\Commands\PrepareCpanelDeployCommand;
use Illuminate\Support\Facades\File;

test('createZip writes archive via temp file to destination', function () {
    $source = sys_get_temp_dir().DIRECTORY_SEPARATOR.'madfan-zip-src-'.uniqid();
    $output = sys_get_temp_dir().DIRECTORY_SEPARATOR.'madfan-zip-out-'.uniqid().'.zip';

    File::ensureDirectoryExists($source.DIRECTORY_SEPARATOR.'nested');
    File::put($source.DIRECTORY_SEPARATOR.'readme.txt', 'hello deploy');
    File::put($source.DIRECTORY_SEPARATOR.'nested'.DIRECTORY_SEPARATOR.'file.txt', 'nested');

    $command = new PrepareCpanelDeployCommand;
    $method = new ReflectionMethod(PrepareCpanelDeployCommand::class, 'createZip');
    $method->invoke($command, $source, $output);

    expect(File::exists($output))->toBeTrue();

    $zip = new ZipArchive;
    expect($zip->open($output))->toBeTrue()
        ->and($zip->locateName('readme.txt'))->not->toBeFalse()
        ->and($zip->locateName('nested/file.txt'))->not->toBeFalse();

    $zip->close();

    File::delete($output);
    File::deleteDirectory($source);
});
