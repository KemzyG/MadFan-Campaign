<?php

namespace Database\Factories;

use App\Enums\MatchTicketStatus;
use App\Models\MatchFixture;
use App\Models\MatchTicket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<MatchTicket>
 */
class MatchTicketFactory extends Factory
{
    protected $model = MatchTicket::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'match_fixture_id' => MatchFixture::factory(),
            'status' => MatchTicketStatus::Paid,
            'price' => '35.00',
            'section' => 'General Admission',
            'seat' => null,
            'code' => 'MF'.Str::upper(Str::random(10)),
            'purchased_at' => now(),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (): array => [
            'status' => MatchTicketStatus::Paid,
            'purchased_at' => now(),
        ]);
    }

    public function used(): static
    {
        return $this->state(fn (): array => [
            'status' => MatchTicketStatus::Used,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (): array => [
            'status' => MatchTicketStatus::Cancelled,
        ]);
    }
}
