<?php

namespace App\Services;

use App\Mail\FanRegistrationWelcomeMail;
use App\Models\User;
use App\Support\ApplicationSettings;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class RegistrationNotificationService
{
    public function __construct(
        protected DynamicMailConfigService $mailConfig,
    ) {}

    public function sendWelcomeEmail(User $user): void
    {
        if (! ApplicationSettings::sendRegistrationWelcomeEmail()) {
            return;
        }

        try {
            $this->mailConfig->apply();

            Mail::to($user->email)->send(new FanRegistrationWelcomeMail(
                $user,
                ApplicationSettings::get('registration_welcome_email_subject'),
            ));
        } catch (Throwable $exception) {
            // Never block passport creation / auth session on SMTP failures.
            Log::warning('Registration welcome email failed.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
