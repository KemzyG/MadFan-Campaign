<?php

use App\Models\User;
use App\Support\ApplicationSettings;
use App\Support\MadFanStory;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\TaskSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
});

test('campaign page is public', function () {
    $this->seed(TaskSeeder::class);

    $this->get('/campaign')
        ->assertSuccessful()
        ->assertSee('favicon.jpg', false)
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Campaign')
            ->has('waitlist_count')
            ->has('fanNav.onboarding_tasks')
            ->has('fanNav.social_handles')
            ->where('fanNav.social_verification_required', false));
});

test('favicon asset exists in public directory', function () {
    expect(is_file(public_path('favicon.jpg')))->toBeTrue();
});

test('fan nav reflects enabled social verification setting', function () {
    ApplicationSettings::sync(['social_verification_required' => 'true']);

    $this->get('/campaign')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('fanNav.social_verification_required', true));
});

test('waitlist does not open onboarding when social verification is disabled', function () {
    // Default is disabled; assert no onboarding prompt.
    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->post('/waitlist', [
        'email' => 'nowaitlist@madfan.test',
    ])
        ->assertRedirect(route('fan.campaign'))
        ->assertSessionMissing('open_onboarding');
});

test('guests can access welcome area static pages', function (string $path, string $title, string $component = 'Fan/StaticPage') {
    $this->get($path)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component($component)
            ->where('title', $title));
})->with([
    ['/roadmap', 'Roadmap'],
    ['/region', 'Region'],
    ['/about', 'About Us'],
    ['/team', 'Our Team', 'Fan/Team'],
]);

test('whitepaper redirects to about', function () {
    $this->get('/whitepaper')->assertRedirect('/about');
});

test('about page includes former whitepaper vision content', function () {
    $this->get('/about')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->where('title', 'About Us')
            ->has('sections', 7)
            ->where('sections.0.title', 'The Attention Economy Failed Fans')
            ->where('sections.2.title', 'Interconnected Building Blocks')
            ->where('sections.4.title', 'Loyalty Deserves Better Infrastructure'));
});

test('team page lists founder and open roles', function () {
    $this->get('/team')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Team')
            ->has('members', 3)
            ->where('members.0.name', 'GODWIN E. BASSEY')
            ->where('members.0.role', 'CEO & Founder')
            ->where('members.0.photo', 'founder-ceo')
            ->where('members.0.location', null)
            ->where('members.1.name', 'Ibrahim Abdulrahman')
            ->where('members.1.role', 'CTO · Chief Technology Officer')
            ->where('members.1.photo', 'cto')
            ->where('members.2.name', 'Lemuel Mendoza')
            ->where('members.2.role', 'CGO · Chief Growth Officer')
            ->where('members.2.photo', 'cgo')
            ->has('intro')
            ->has('culture')
            ->has('open_roles', 3));
});

test('team member source photos exist in resources assets', function () {
    foreach ([
        'founder-ceo.jpg',
        'cto.jpg',
        'cgo.jpg',
    ] as $file) {
        expect(is_file(resource_path('assets/'.$file)))->toBeTrue();
    }
});

test('only the about page references founder location', function () {
    $about = MadFanStory::page('about');
    $team = MadFanStory::page('team');
    $region = MadFanStory::page('region');
    $roadmap = MadFanStory::page('roadmap');

    $encode = fn (array $payload): string => strtolower(json_encode($payload, JSON_THROW_ON_ERROR));

    expect($encode($about))->toContain('lagos')
        ->and($encode($about))->toContain('africa')
        ->and($encode($team))->not->toContain('lagos')
        ->and($encode($team))->not->toContain('nigeria')
        ->and($encode($team))->not->toContain('africa')
        ->and($encode($region))->not->toContain('lagos')
        ->and($encode($region))->not->toContain('nigeria')
        ->and($encode($region))->not->toContain('africa')
        ->and($encode($roadmap))->not->toContain('lagos')
        ->and($encode($roadmap))->not->toContain('africa');
});

test('roadmap and region pages use long-form narrative sections', function () {
    $this->get('/roadmap')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->has('sections', 5)
            ->where('title', 'Roadmap'));

    $this->get('/region')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->has('sections', 5)
            ->where('title', 'Region'));
});

test('static pages remain available during maintenance mode', function () {
    ApplicationSettings::sync(['system_maintenance' => 'true']);

    $this->get('/whitepaper')->assertRedirect('/about');
    $this->get('/roadmap')->assertSuccessful();
    $this->get('/about')->assertSuccessful();
});

test('static story pages expose narrative sections', function () {
    $this->get('/roadmap')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/StaticPage')
            ->has('sections')
            ->where('title', 'Roadmap'));
});

test('waitlist signup stores email for registration', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->post('/waitlist', [
        'email' => 'fan@waitlist.test',
    ])->assertRedirect(route('fan.campaign'));

    $this->get('/')
        ->assertInertia(fn ($page) => $page->where('fanNav.waitlist_email', 'fan@waitlist.test'));
});

test('guests are redirected from fan app pages', function (string $path) {
    $this->get($path)->assertRedirect('/login');
})->with(['/daily-claim', '/tasks', '/passport']);

test('authenticated users can access fan app pages', function (string $path, string $component) {
    $user = connectRequiredSocialAccounts(createUser());

    $this->actingAs($user)
        ->get($path)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component($component)
            ->has('fanNav.onboarding_tasks')
            ->has('fanNav.social_handles'));
})->with([
    ['/daily-claim', 'Fan/DailyClaim'],
    ['/tasks', 'Fan/Tasks'],
    ['/passport', 'Fan/Passport'],
]);

test('admin users can also access fan app pages', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/daily-claim')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Fan/DailyClaim'));
});

test('register page exposes stepper data', function () {
    $club = ensureRegistrationClub('Arsenal FC');

    $this->get('/register')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Auth/Register')
            ->has('clubs', 1)
            ->where('clubs.0.id', $club->id)
            ->where('clubs.0.name', 'Arsenal FC')
            ->missing('avatar_options'));
});

test('register validation errors use friendly messages', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    createUser(['email' => 'taken@madfan.test']);

    $this->from('/register')
        ->post('/register', fanRegisterPayload([
            'email' => 'taken@madfan.test',
            'club' => 'Arsenal FC',
        ]))
        ->assertRedirect('/register')
        ->assertSessionHasErrors('email');
});

test('fan can register and reach email verification notice', function () {
    requireSocialConnections();
    $this->withoutMiddleware(PreventRequestForgery::class);

    $club = ensureRegistrationClub('Arsenal FC');

    $this->post('/register', fanRegisterPayload([
        'email' => 'newfan@madfan.test',
        'club' => 'Arsenal FC',
    ]))->assertRedirect(route('verification.notice'));

    $this->assertAuthenticated();

    $user = User::query()->where('email', 'newfan@madfan.test')->first();

    expect($user)->not->toBeNull()
        ->and($user->handle)->toBeNull()
        ->and($user->club)->toBe('Arsenal FC')
        ->and($user->league)->toBe($club->league->name);
});

test('fan can register with the Other club fallback', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->post('/register', fanRegisterPayload([
        'email' => 'otherfan@madfan.test',
        'club' => 'Other',
    ]))->assertRedirect();

    $this->assertAuthenticated();

    $user = User::query()->where('email', 'otherfan@madfan.test')->first();

    expect($user)->not->toBeNull()
        ->and($user->club)->toBe('Other')
        ->and($user->league)->toBeNull();
});

test('fan login redirects incomplete onboarding users to connect accounts', function () {
    requireSocialConnections();
    createUser(['email' => 'onboarding@madfan.test']);

    $this->get('/login');

    $this->post('/login', [
        'email' => 'onboarding@madfan.test',
        'password' => validTestPassword(),
        '_token' => csrf_token(),
    ])
        ->assertRedirect(route('fan.connect-accounts', ['onboarding' => 1]))
        ->assertSessionHas('onboarding_required', true);
});

test('connect accounts onboarding shows separate stepper', function () {
    requireSocialConnections();
    $user = createUser();

    $this->actingAs($user)
        ->get('/connect-accounts?onboarding=1')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/ConnectAccounts')
            ->where('onboarding', true)
            ->has('accounts', 3));
});

test('authenticated users with incomplete onboarding are redirected from register', function () {
    requireSocialConnections();
    $user = createUser();

    $this->actingAs($user)
        ->get('/register')
        ->assertRedirect(route('fan.connect-accounts', ['onboarding' => 1]));
});

test('fan login via web form when onboarding is complete', function () {
    $user = connectRequiredSocialAccounts(createUser(['email' => 'fan-login@madfan.test']));

    $this->get('/login');

    $this->post('/login', [
        'email' => 'fan-login@madfan.test',
        'password' => validTestPassword(),
        '_token' => csrf_token(),
    ])->assertRedirect(route('fan.dashboard'));

    $this->assertAuthenticatedAs($user);
});

test('fan login shows a helpful message for invalid credentials', function () {
    createUser(['email' => 'fan-login@madfan.test']);

    $this->get('/login');

    $this->post('/login', [
        'email' => 'fan-login@madfan.test',
        'password' => 'wrong-password',
        '_token' => csrf_token(),
    ])->assertSessionHasErrors([
        'email' => 'We couldn\'t sign you in. Check your email and password, or create an account if you\'re new.',
    ]);
});
