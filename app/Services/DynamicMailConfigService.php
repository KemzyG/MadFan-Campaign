<?php

namespace App\Services;

use App\Support\ApplicationSettings;
use Illuminate\Support\Facades\Config;

class DynamicMailConfigService
{
    public function apply(): void
    {
        $mailer = ApplicationSettings::get('mail_mailer', 'log');

        Config::set('mail.default', $mailer);

        if ($mailer === 'smtp') {
            Config::set('mail.mailers.smtp.host', ApplicationSettings::get('mail_host'));
            Config::set('mail.mailers.smtp.port', ApplicationSettings::int('mail_port'));
            Config::set('mail.mailers.smtp.username', ApplicationSettings::get('mail_username'));
            Config::set('mail.mailers.smtp.password', ApplicationSettings::mailPassword());
            Config::set('mail.mailers.smtp.encryption', ApplicationSettings::get('mail_encryption') ?: null);
        }

        Config::set('mail.from.address', ApplicationSettings::get('mail_from_address'));
        Config::set('mail.from.name', ApplicationSettings::get('mail_from_name'));
    }
}
