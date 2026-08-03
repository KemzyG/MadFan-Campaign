<?php

use Database\Seeders\SettingSeeder;

test('guests are redirected to login', function () {
    $this->get('/admin')->assertRedirect('/admin/login');
});

test('regular users cannot access the admin dashboard', function () {
    $user = createUser();

    $this->actingAs($user)
        ->get('/admin')
        ->assertForbidden();
});

test('inertia admin operators cannot access filament', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/admin')
        ->assertForbidden();
});

test('super-admin can access the filament dashboard', function () {
    $superAdmin = createSuperAdminUser();

    $this->actingAs($superAdmin)
        ->get('/admin')
        ->assertSuccessful();
});

test('super-admin can access seasons resource', function () {
    $superAdmin = createSuperAdminUser();

    $this->actingAs($superAdmin)
        ->get('/admin/seasons')
        ->assertSuccessful();
});

test('super-admin can access tasks resource', function () {
    $superAdmin = createSuperAdminUser();

    $this->actingAs($superAdmin)
        ->get('/admin/tasks')
        ->assertSuccessful();
});

test('super-admin can access custom system logs page', function () {
    $superAdmin = createSuperAdminUser();

    $this->actingAs($superAdmin)
        ->get('/admin/system-logs')
        ->assertSuccessful();
});

test('super-admin can access the analytics dashboard', function () {
    $superAdmin = createSuperAdminUser();

    $this->actingAs($superAdmin)
        ->get('/admin/reports')
        ->assertSuccessful();
});

test('super-admin can access the settings form page', function () {
    $superAdmin = createSuperAdminUser();
    $this->seed(SettingSeeder::class);

    $this->actingAs($superAdmin)
        ->get('/admin/settings')
        ->assertSuccessful()
        ->assertDontSee('Bulk actions', false);
});

test('super-admin can access filament create forms', function (string $path) {
    $superAdmin = createSuperAdminUser();

    $this->actingAs($superAdmin)
        ->get($path)
        ->assertSuccessful();
})->with([
    '/admin/seasons/create',
    '/admin/tasks/create',
    '/admin/loyalty-tiers/create',
    '/admin/leagues/create',
    '/admin/clubs/create',
    '/admin/referrals/create',
    '/admin/users/create',
    '/admin/admins/create',
    '/admin/admin-organizations/create',
]);
