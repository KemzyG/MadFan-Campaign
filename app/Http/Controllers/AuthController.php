<?php

namespace App\Http\Controllers;

use App\Http\Requests\FirebaseLoginRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\PasetoService;
use App\Services\ReferralService;
use App\Services\RegistrationIdentityGuard;
use App\Services\RegistrationNotificationService;
use App\Support\ApplicationSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        protected PasetoService $pasetoService,
        protected ReferralService $referralService,
        protected RegistrationNotificationService $registrationNotifications,
        protected RegistrationIdentityGuard $registrationIdentity,
    ) {}

    /**
     * Register a new user with email/password.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        if (! ApplicationSettings::registrationEnabled()) {
            return response()->json(['message' => 'Registration is currently closed.'], 403);
        }

        $data = $request->validated();

        $this->registrationIdentity->assertCanRegister($request, $data['email']);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'],
            'password_hash' => Hash::make($data['password']),
            'auth_provider' => 'password',
            'fan_id' => 'MF-'.strtoupper(Str::random(5)),
            ...$this->registrationIdentity->identityAttributes($request, $data['email']),
        ]);

        $this->referralService->attributeReferral($user, $data['referrer_fan_id'] ?? null);

        $this->registrationNotifications->sendWelcomeEmail($user);
        $user->sendEmailVerificationNotification();

        $token = $this->pasetoService->generateToken($user->id);
        $emailVerified = $user->hasVerifiedEmail();

        return response()->json([
            'message' => $emailVerified
                ? 'Registration successful.'
                : 'Registration successful. Verify your email to unlock full access.',
            'token' => $token,
            'email_verified' => $emailVerified,
            'user' => new UserResource($user->load(['loyaltyTier.tierRewards', 'passport'])),
        ], 201)->withCookie($this->registrationIdentity->makeLockCookie($user));
    }

    /**
     * Login with email and password.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->update(['last_login_at' => now()]);

        $token = $this->pasetoService->generateToken($user->id);

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user->load(['loyaltyTier.tierRewards', 'passport'])),
        ]);
    }

    /**
     * Firebase token login — disabled.
     */
    public function firebaseLogin(FirebaseLoginRequest $request): JsonResponse
    {
        return response()->json(['message' => 'Firebase authentication is disabled.'], 400);
    }

    /**
     * Register a new user via Firebase token — disabled.
     */
    public function firebaseRegister(FirebaseLoginRequest $request): JsonResponse
    {
        return response()->json(['message' => 'Firebase authentication is disabled.'], 400);
    }

    /**
     * Return authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource(
                $request->user()->load(['loyaltyTier.tierRewards', 'passport', 'streak'])
            ),
        ]);
    }

    /**
     * Logout and revoke the current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->incrementTokenVersion();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Decode a mock Firebase token (base64-encoded JSON for dev/test purposes).
     *
     * @return array<string, mixed>|null
     */
    private function decodeMockFirebaseToken(string $token): ?array
    {
        try {
            $decoded = base64_decode($token, true);
            if ($decoded === false) {
                return null;
            }

            /** @var array<string, mixed>|null $payload */
            $payload = json_decode($decoded, true);

            return is_array($payload) ? $payload : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
