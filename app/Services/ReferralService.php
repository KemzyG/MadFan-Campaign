<?php

namespace App\Services;

use App\Models\PointTransaction;
use App\Models\Referral;
use App\Models\Season;
use App\Models\User;
use App\Models\Waitlist;
use App\Support\ApplicationSettings;
use Illuminate\Support\Facades\DB;

class ReferralService
{
    public const SESSION_KEY = 'referrer_fan_id';

    public const REFERRAL_POINTS = 500;

    public function referralBonusPoints(): int
    {
        return ApplicationSettings::referralBonusPoints();
    }

    public function captureReferrer(string $fanId): ?User
    {
        $referrer = User::query()->where('fan_id', $fanId)->first();

        if (! $referrer) {
            return null;
        }

        session()->put(self::SESSION_KEY, $fanId);

        return $referrer;
    }

    public function resolveReferrerFanId(?string $fanId = null): ?string
    {
        $fanId = $fanId ?? session(self::SESSION_KEY);

        if (! is_string($fanId) || $fanId === '') {
            return null;
        }

        return $fanId;
    }

    public function waitlistSource(?string $fanId = null): ?string
    {
        $fanId = $this->resolveReferrerFanId($fanId);

        if ($fanId === null) {
            return null;
        }

        return 'referral:'.$fanId;
    }

    public function attributeReferral(User $referredUser, ?string $referrerFanId = null): ?Referral
    {
        $referrerFanId = $this->resolveReferrerFanId($referrerFanId);

        if ($referrerFanId === null) {
            return null;
        }

        $referrer = User::query()->where('fan_id', $referrerFanId)->first();

        if (! $referrer || $referrer->id === $referredUser->id) {
            $this->forgetReferrer();

            return null;
        }

        if (Referral::query()->where('referred_user_id', $referredUser->id)->exists()) {
            $this->forgetReferrer();

            return null;
        }

        $existingReferral = Referral::query()
            ->where('referrer_user_id', $referrer->id)
            ->where('referred_user_id', $referredUser->id)
            ->first();

        if ($existingReferral) {
            $this->forgetReferrer();

            return $existingReferral;
        }

        $referral = DB::transaction(function () use ($referrer, $referredUser, $referrerFanId): Referral {
            $season = Season::query()->where('status', 'active')->latest('starts_at')->first();
            $idempotencyKey = 'referral-'.$referrer->id.'-'.$referredUser->id;

            if (PointTransaction::query()->where('idempotency_key', $idempotencyKey)->exists()) {
                return Referral::query()
                    ->where('referrer_user_id', $referrer->id)
                    ->where('referred_user_id', $referredUser->id)
                    ->firstOrFail();
            }

            $points = $this->referralBonusPoints();
            $newBalance = $referrer->total_points + $points;

            $transaction = PointTransaction::create([
                'user_id' => $referrer->id,
                'season_id' => $season?->id,
                'source_type' => 'referral',
                'source_id' => (string) $referredUser->id,
                'amount' => $points,
                'balance_after' => $newBalance,
                'reason' => "Referral reward: {$referredUser->username} joined",
                'idempotency_key' => $idempotencyKey,
            ]);

            $referrer->increment('total_points', $points);
            $referrer->increment('referral_count');

            return Referral::create([
                'referrer_user_id' => $referrer->id,
                'referred_user_id' => $referredUser->id,
                'referred_email' => $referredUser->email,
                'referred_user_handle' => $referredUser->username,
                'referral_code' => $referrerFanId,
                'status' => 'rewarded',
                'points_awarded' => $points,
                'point_transaction_id' => $transaction->id,
                'activated_at' => now(),
                'rewarded_at' => now(),
            ]);
        });

        $this->forgetReferrer();
        $this->linkWaitlistToUser($referredUser);

        return $referral;
    }

    public function linkWaitlistToUser(User $user): void
    {
        Waitlist::query()
            ->where('email', $user->email)
            ->whereNull('user_id')
            ->update(['user_id' => $user->id]);
    }

    public function forgetReferrer(): void
    {
        session()->forget(self::SESSION_KEY);
    }
}
