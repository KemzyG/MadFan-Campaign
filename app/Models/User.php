<?php

namespace App\Models;

use App\Enums\AdminPermission;
use App\Services\RegistrationIdentityGuard;
use App\Support\PublicStorageUrl;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Traits\HasRoles;

#[Fillable([
    'name',
    'email',
    'email_normalized',
    'password',
    'password_hash',
    'firebase_uid',
    'auth_provider',
    'username',
    'handle',
    'fan_id',
    'country',
    'league',
    'club',
    'favourite_club_id',
    'favourite_sport_id',
    'bio',
    'date_of_birth',
    'banner_path',
    'avatar_emoji',
    'avatar_path',
    'loyalty_tier_id',
    'current_streak_days',
    'best_streak_days',
    'referral_count',
    'email_verified_at',
    'social_onboarded_at',
    'last_login_at',
    'token_version',
    'current_admin_organization_id',
    'registration_fingerprint',
    'registration_ip',
    'registration_user_agent',
])]
#[Hidden([
    'password',
    'password_hash',
    'remember_token',
    'firebase_uid',
    'token_version',
    'email_normalized',
    'registration_fingerprint',
    'registration_ip',
    'registration_user_agent',
    'shootout_cooldown_until',
    'shootout_last_awarded_at',
    'shootout_stats_date',
    'mfa_secret',
    'mfa_recovery_codes',
])]
class User extends Authenticatable implements FilamentUser, MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->auth_provider)) {
                $user->auth_provider = 'password';
            }
            if (empty($user->fan_id)) {
                $user->fan_id = 'MF-'.strtoupper(Str::random(5));
            }
            if (empty($user->username) && ! empty($user->email)) {
                $base = explode('@', $user->email)[0];
                $username = $base;
                $count = 1;
                while (static::where('username', $username)->exists()) {
                    $username = $base.$count++;
                }
                $user->username = $username;
            }
            if (filled($user->email) && blank($user->email_normalized)) {
                $user->email_normalized = app(RegistrationIdentityGuard::class)
                    ->normalizeEmail((string) $user->email);
            }
        });

        static::updating(function (User $user): void {
            if ($user->isDirty('email') && filled($user->email)) {
                $user->email_normalized = app(RegistrationIdentityGuard::class)
                    ->normalizeEmail((string) $user->email);
            }
        });
    }

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    /**
     * When email verification is disabled (local/dev), treat the address as verified
     * so middleware, policies, and auth redirects stay open without removing MustVerifyEmail.
     */
    public function hasVerifiedEmail(): bool
    {
        if (! config('auth.email_verification_enabled')) {
            return true;
        }

        return ! is_null($this->email_verified_at);
    }

    /**
     * Skip verification mail when EMAIL_VERIFICATION_ENABLED=false.
     */
    public function sendEmailVerificationNotification(): void
    {
        if (! config('auth.email_verification_enabled')) {
            return;
        }

        $this->notify(new VerifyEmail);
    }

    /**
     * Map password attribute to password_hash to prevent column mismatch.
     */
    protected function password(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->password_hash,
            set: function ($value) {
                if (empty($value)) {
                    return ['password_hash' => null];
                }
                $isHashed = password_get_info($value)['algo'] !== null;

                return [
                    'password_hash' => $isHashed ? $value : Hash::make($value),
                ];
            }
        );
    }

    /**
     * Public URL for the fan avatar image (uploaded or default).
     */
    protected function avatarUrl(): Attribute
    {
        return Attribute::get(function (): string {
            if (filled($this->avatar_path)) {
                $url = PublicStorageUrl::path($this->avatar_path);

                if ($url === PublicStorageUrl::defaultImageUrl()) {
                    return $url;
                }

                $version = $this->updated_at?->timestamp ?? time();
                $separator = str_contains($url, '?') ? '&' : '?';

                return $url.$separator.'v='.$version;
            }

            return PublicStorageUrl::defaultImageUrl();
        });
    }

    /**
     * Whether the fan has uploaded a custom avatar image.
     */
    protected function hasCustomAvatar(): Attribute
    {
        return Attribute::get(fn (): bool => filled($this->avatar_path));
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'social_onboarded_at' => 'datetime',
            'last_login_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'staff_position_assigned_at' => 'datetime',
            'shootout_cooldown_until' => 'datetime',
            'shootout_last_awarded_at' => 'datetime',
            'shootout_stats_date' => 'date',
            'date_of_birth' => 'date',
            'is_staff' => 'boolean',
            'mfa_confirmed_at' => 'datetime',
        ];
    }

    public function hasMfaEnabled(): bool
    {
        return filled($this->mfa_secret) && $this->mfa_confirmed_at !== null;
    }

    /**
     * Presence window: a fan is "online" if seen within this many minutes.
     * The heartbeat (TouchLastSeen) refreshes last_seen_at at most once/60s.
     */
    public const ONLINE_WINDOW_MINUTES = 5;

    public function isOnline(): bool
    {
        return $this->last_seen_at?->gt(now()->subMinutes(self::ONLINE_WINDOW_MINUTES)) ?? false;
    }

    /**
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeOnline(Builder $query): Builder
    {
        return $query->where('last_seen_at', '>=', now()->subMinutes(self::ONLINE_WINDOW_MINUTES));
    }

    public function staffPositionAssignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_position_assigned_by');
    }

    public function assignedStaffTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_user_id');
    }

    public function isActiveStaffMember(): bool
    {
        return $this->is_staff
            && $this->staff_status === 'active'
            && filled($this->staff_position);
    }

    public function deviceTokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }

    public function dailyClaims(): HasMany
    {
        return $this->hasMany(DailyClaim::class);
    }

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function streak(): HasOne
    {
        return $this->hasOne(Streak::class);
    }

    public function userTaskProgress(): HasMany
    {
        return $this->hasMany(UserTaskProgress::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_user_id');
    }

    public function referred_referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'referred_user_id');
    }

    public function loyaltyTier(): BelongsTo
    {
        return $this->belongsTo(LoyaltyTier::class);
    }

    public function favouriteClub(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'favourite_club_id');
    }

    public function favouriteSport(): BelongsTo
    {
        return $this->belongsTo(Sport::class, 'favourite_sport_id');
    }

    public function clubMemberships(): HasMany
    {
        return $this->hasMany(ClubMembership::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'author_id');
    }

    public function matchTickets(): HasMany
    {
        return $this->hasMany(MatchTicket::class);
    }

    public function jerseyOrders(): HasMany
    {
        return $this->hasMany(JerseyOrder::class);
    }

    public function hostedStages(): HasMany
    {
        return $this->hasMany(Stage::class, 'host_id');
    }

    public function stageParticipations(): HasMany
    {
        return $this->hasMany(StageParticipant::class);
    }

    public function following(): HasMany
    {
        return $this->hasMany(Follow::class, 'follower_id');
    }

    public function followers(): HasMany
    {
        return $this->hasMany(Follow::class, 'following_id');
    }

    public function isFollowing(User $other): bool
    {
        return Follow::query()
            ->where('follower_id', $this->id)
            ->where('following_id', $other->id)
            ->exists();
    }

    public function passport(): HasOne
    {
        return $this->hasOne(Passport::class);
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function weeklyProgresses(): HasMany
    {
        return $this->hasMany(WeeklyProgress::class);
    }

    public function userReferralMilestones(): HasMany
    {
        return $this->hasMany(UserReferralMilestone::class);
    }

    public function seasonClaimHistories(): HasMany
    {
        return $this->hasMany(SeasonClaimHistory::class);
    }

    public function leaderboardEntries(): HasMany
    {
        return $this->hasMany(LeaderboardEntry::class);
    }

    /**
     * @var list<string>
     */
    public const ADMIN_ROLES = ['super-admin', 'admin', 'support', 'management'];

    /**
     * Inertia console operators (provisioned via Filament by super-admin).
     *
     * @var list<string>
     */
    public const INERTIA_ADMIN_ROLES = ['admin', 'support', 'management'];

    public function adminOrganizations(): BelongsToMany
    {
        return $this->belongsToMany(AdminOrganization::class, 'admin_organization_user')
            ->withTimestamps();
    }

    public function currentAdminOrganization(): BelongsTo
    {
        return $this->belongsTo(AdminOrganization::class, 'current_admin_organization_id');
    }

    public function isInertiaAdmin(): bool
    {
        return $this->hasAnyRole(self::INERTIA_ADMIN_ROLES);
    }

    /**
     * Whether this account may open the Inertia admin console (/app).
     * Role-based operators always can; active staff need dashboard.view (or other staff perms via Spatie).
     */
    public function canAccessInertiaAdmin(): bool
    {
        if ($this->hasAnyRole(self::ADMIN_ROLES)) {
            return true;
        }

        return $this->isActiveStaffMember()
            && $this->can(AdminPermission::DashboardView->value);
    }

    /**
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeFanAccounts(Builder $query): Builder
    {
        return $query->whereDoesntHave('roles', fn (Builder $roleQuery): Builder => $roleQuery->whereIn('name', self::ADMIN_ROLES));
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->hasRole('super-admin');
    }

    public function incrementTokenVersion(): void
    {
        $this->increment('token_version');
    }
}
