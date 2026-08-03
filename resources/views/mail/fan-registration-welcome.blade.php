<x-mail::message>
# Welcome to Mad Fan, {{ $user->name }}!

Your passport is ready.

**Fan ID:** {{ $user->fan_id }}  
**Club:** {{ $user->club ?? 'Not set' }}

@if(\App\Support\ApplicationSettings::socialVerificationRequired())
Connect your X and Discord accounts to unlock tasks and start earning points.

<x-mail::button :url="$connectUrl">
Connect Accounts
</x-mail::button>
@else
Jump in and claim your first daily reward.

<x-mail::button :url="$dailyClaimUrl">
Go to Daily Claim
</x-mail::button>
@endif

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
