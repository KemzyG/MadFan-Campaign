<?php

use App\Models\AdminOrganization;
use App\Models\User;

test('org admin only sees fans in their partition', function () {
    $organization = AdminOrganization::factory()->countries(['Spain'])->create();
    $orgAdmin = createOrgAdmin($organization, 'admin');

    $visibleFan = createUser(['country' => 'Spain', 'name' => 'Spain Fan']);
    $hiddenFan = createUser(['country' => 'England', 'name' => 'England Fan']);

    $this->actingAs($orgAdmin)
        ->get('/ops/users')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 1)
            ->where('users.data.0.id', $visibleFan->id)
        );
});

test('super-admin sees all fans when no organization is selected', function () {
    $superAdmin = createSuperAdminUser();

    createUser(['country' => 'Spain']);
    createUser(['country' => 'England']);

    $this->actingAs($superAdmin)
        ->get('/ops/users')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->where('adminOrganization.is_super_admin', true)
            ->has('users.data', 2)
        );
});

test('super-admin can narrow fan visibility by switching organization', function () {
    $superAdmin = createSuperAdminUser();
    $organization = AdminOrganization::factory()->countries(['France'])->create();

    createUser(['country' => 'France']);
    createUser(['country' => 'Germany']);

    $this->actingAs($superAdmin)
        ->post(route('admin.organization.switch'), [
            'organization_id' => $organization->id,
        ])
        ->assertRedirect();

    $this->actingAs($superAdmin)
        ->get('/ops/users')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('users.data', 1)
            ->where('adminOrganization.current.id', $organization->id)
        );
});

test('inertia operators cannot access removed admin management routes', function () {
    $superAdmin = createSuperAdminUser();

    $this->actingAs($superAdmin)
        ->get('/ops/admins')
        ->assertNotFound();

    $this->actingAs($superAdmin)
        ->get('/ops/roles')
        ->assertNotFound();
});

test('super-admin provisions an inertia operator via filament organizations', function () {
    $superAdmin = createSuperAdminUser();
    $organization = AdminOrganization::factory()->create();

    $operator = User::factory()->create([
        'email' => 'operator@madfan.test',
    ]);
    $operator->syncRoles(['support']);
    $operator->adminOrganizations()->attach($organization);

    expect($operator->hasRole('support'))->toBeTrue()
        ->and($operator->adminOrganizations)->toHaveCount(1)
        ->and($operator->canAccessPanel(filament()->getPanel('admin')))->toBeFalse();

    $this->actingAs($operator)
        ->get('/ops')
        ->assertSuccessful();
});
