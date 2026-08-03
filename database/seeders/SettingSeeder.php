<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Support\ApplicationSettings;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (ApplicationSettings::definitions() as $key => $definition) {
            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => ApplicationSettings::defaults()[$key],
                    'description' => $definition['description'],
                    'type' => $definition['type'],
                ],
            );
        }
    }
}
