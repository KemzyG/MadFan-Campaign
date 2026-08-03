<?php

namespace App\Services\Admin;

use App\Models\AdminOrganization;
use App\Models\User;
use App\Support\FanPartitionScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Session\Store;

class AdminOrganizationContext
{
    public const SESSION_KEY = 'admin_organization_id';

    private ?User $user = null;

    private ?AdminOrganization $organization = null;

    public function bootstrap(User $user, Store $session): void
    {
        $this->user = $user;
        $this->organization = $this->resolveOrganization($user, $session);
    }

    public function user(): ?User
    {
        return $this->user;
    }

    public function organization(): ?AdminOrganization
    {
        return $this->organization;
    }

    public function isSuperAdmin(): bool
    {
        return $this->user?->hasRole('super-admin') ?? false;
    }

    /**
     * @return list<array{id: int, name: string, slug: string}>
     */
    public function availableOrganizations(): array
    {
        if ($this->user === null) {
            return [];
        }

        if ($this->isSuperAdmin()) {
            return AdminOrganization::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (AdminOrganization $organization): array => [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'slug' => $organization->slug,
                ])
                ->all();
        }

        return $this->user->adminOrganizations()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['admin_organizations.id', 'admin_organizations.name', 'admin_organizations.slug'])
            ->map(fn (AdminOrganization $organization): array => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
            ])
            ->all();
    }

    public function applyFanScope(Builder $query): Builder
    {
        if ($this->user === null) {
            return $query->whereRaw('0 = 1');
        }

        return FanPartitionScope::apply($query, $this->organization, $this->user);
    }

    public function fanIsVisible(User $fan): bool
    {
        if ($this->user === null) {
            return false;
        }

        return FanPartitionScope::fanIsVisible($fan, $this->organization, $this->user);
    }

    public function switchOrganization(User $user, Store $session, ?int $organizationId): void
    {
        if ($organizationId === null) {
            if (! $user->hasRole('super-admin')) {
                abort(403, 'Only super-admins can view all organizations.');
            }

            $session->forget(self::SESSION_KEY);
            $user->forceFill(['current_admin_organization_id' => null])->save();
            $this->bootstrap($user, $session);

            return;
        }

        $organization = $this->organizationQueryFor($user)
            ->whereKey($organizationId)
            ->first();

        if ($organization === null) {
            abort(403, 'You do not have access to that organization.');
        }

        $session->put(self::SESSION_KEY, $organization->id);
        $user->forceFill(['current_admin_organization_id' => $organization->id])->save();
        $this->bootstrap($user, $session);
    }

    private function resolveOrganization(User $user, Store $session): ?AdminOrganization
    {
        $organizationId = $session->get(self::SESSION_KEY) ?? $user->current_admin_organization_id;

        if ($organizationId === null) {
            if ($user->hasRole('super-admin')) {
                return null;
            }

            $defaultOrganization = $this->organizationQueryFor($user)->orderBy('name')->first();

            if ($defaultOrganization !== null) {
                $session->put(self::SESSION_KEY, $defaultOrganization->id);
                $user->forceFill(['current_admin_organization_id' => $defaultOrganization->id])->save();

                return $defaultOrganization;
            }

            return null;
        }

        return $this->organizationQueryFor($user)
            ->whereKey($organizationId)
            ->first();
    }

    /**
     * @return Builder<AdminOrganization>
     */
    private function organizationQueryFor(User $user): Builder
    {
        if ($user->hasRole('super-admin')) {
            return AdminOrganization::query()->where('is_active', true);
        }

        return AdminOrganization::query()
            ->where('is_active', true)
            ->whereHas('members', fn (Builder $query): Builder => $query->whereKey($user->id));
    }
}
