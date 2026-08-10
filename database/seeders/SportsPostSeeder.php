<?php

namespace Database\Seeders;

use App\Enums\PostType;
use App\Models\Club;
use App\Models\Post;
use App\Models\User;
use App\Services\Social\FeedService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Idempotent club-desk posts with professional sports analysis (≤280 chars each).
 */
class SportsPostSeeder extends Seeder
{
    /**
     * Club short code => professional briefing body.
     *
     * @var array<string, string>
     */
    private const BRIEFINGS = [
        'ARS' => 'Arsenal’s inverted full-backs build a midfield box in possession. Watch rest-defence when both step in: the opposite centre-back must hold the half-space to kill transitions behind the press.',
        'CHE' => 'Chelsea’s double pivot is designed for cover shadows, not line-breaking carries. Progress comes from third-man combinations into the half-spaces—track if the No. 10s receive on the half-turn under pressure.',
        'LIV' => 'Liverpool’s high press still hinges on the first trigger: opposition full-back receives. Delayed jump from the near eight opens the corridor to the pivot. Measure compactness between the front three and the midfield arc.',
        'MCI' => 'Man City’s positional play uses overloads to isolate the weak-side 1v1. Value is created after the second switch of play; early crosses before the box is set suppress expected threat despite territory.',
        'MUN' => 'United’s best chance creation comes from verticality through the 10 zone after a progressive reception. When the front line stays stretched, the six must refuse progressive hops that leave the back line exposed.',
        'TOT' => 'Tottenham generate progressive value via wide overloads and cut-backs, not central circulation. Set-piece structure remains a reliable non-open-play lever when open-play territory doesn’t convert to shots.',
        'NEW' => 'Newcastle’s rest-defence is built to win the second ball after a front-line press. Depth of the back five-ish block must stay connected—if the wing-backs jump alone, central lanes gift counters.',
        'RMA' => 'Real Madrid still balance transitional threat with controlled rest phases. Look for the free 8 drifting into the pocket between opponent lines; that reception unlocks both switch-and-cross and cutback patterns.',
        'BAR' => 'Barcelona’s control rests on positional superiority around the opponent’s first line. When the pivot is marked, the drop from a centre-back into midfield maintains tempo without surrendering defensive structure.',
        'JUV' => 'Juventus prioritise defensive spacing and delayed pressure. Progress often starts with a recycled switch to the weak side before a late runner attacks the far post—patience over forced central entries.',
        'MIL' => 'AC Milan’s press aims to force play wide, then trap on the touchline. The far-side midfielder must tuck in early; late cover invites cutbacks into the penalty spot after the first line is beaten.',
        'INT' => 'Inter’s mid-block stays compact vertically, inviting possession then striking on regain. Wing-back timing into the box decides shot quality—early arrivals before the second ball reduces high-quality finishes.',
    ];

    public function run(): void
    {
        $seeded = 0;

        foreach (self::BRIEFINGS as $short => $body) {
            $body = Str::limit(trim($body), FeedService::MAX_BODY_LENGTH, '');

            $club = Club::query()->where('short', $short)->first();

            if ($club === null) {
                $this->command?->warn("Skipping sports post: club {$short} not found.");

                continue;
            }

            $editor = $this->upsertClubEditor($club);
            $this->upsertBriefing($editor, $club, $body);
            $seeded++;
        }

        $this->command?->info("Sports posts ready: {$seeded} club briefings.");
    }

    private function upsertClubEditor(Club $club): User
    {
        $short = strtolower((string) $club->short);
        $email = "{$short}.desk@madfan.test";
        $handle = "{$short}_desk";
        $fanId = 'MF-D'.strtoupper(Str::limit($club->short, 4, ''));

        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $club->name.' Desk',
                'username' => $handle,
                'handle' => $handle,
                'password_hash' => Hash::make('DeskSeed123!'),
                'auth_provider' => 'password',
                'fan_id' => $fanId,
                'favourite_club_id' => $club->id,
                'club' => $club->name,
                'bio' => 'Official tactical desk notes for '.$club->name.'.',
                'email_verified_at' => now(),
                'social_onboarded_at' => now(),
            ],
        );

        return $user;
    }

    private function upsertBriefing(User $editor, Club $club, string $body): void
    {
        $existing = Post::query()
            ->where('author_id', $editor->id)
            ->where('club_id', $club->id)
            ->whereNull('reply_to_id')
            ->where('type', PostType::Status->value)
            ->orderBy('id')
            ->first();

        if ($existing !== null) {
            $existing->update([
                'body' => $body,
                'is_hidden' => false,
                'published_at' => $existing->published_at ?? now()->subHours(max(1, $club->id % 48)),
            ]);

            return;
        }

        Post::query()->create([
            'author_id' => $editor->id,
            'club_id' => $club->id,
            'type' => PostType::Status,
            'body' => $body,
            'likes_count' => 0,
            'replies_count' => 0,
            'reposts_count' => 0,
            'quotes_count' => 0,
            'views_count' => 0,
            'is_hidden' => false,
            'published_at' => now()->subHours(max(1, $club->id % 72)),
        ]);
    }
}
