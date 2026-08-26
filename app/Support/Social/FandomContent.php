<?php

namespace App\Support\Social;

use App\Models\Fandom;

/**
 * Static "About / History / Rules" copy for a fandom's More sheet. There's
 * no CMS behind this yet — one fandom (Football) exists today, so this is
 * hand-written the same way MadFanStory/MadFanLegal are, not a database
 * table, until a second fandom makes that worth building.
 */
class FandomContent
{
    /**
     * @return array<string, mixed>
     */
    public static function about(Fandom $fandom): array
    {
        return [
            'name' => $fandom->name,
            'description' => $fandom->description
                ?? "Every Mad Fan who follows {$fandom->name} — one terrace, every club, every match.",
        ];
    }

    /**
     * @return list<array{heading: string, body: string}>
     */
    public static function history(): array
    {
        return [
            [
                'heading' => 'Where it started',
                'body' => 'Mad Fan opened its doors around one sport — football — because it\'s the game that already had a global terrace waiting for a home. Every club on the platform sits inside this one Fandom.',
            ],
            [
                'heading' => 'What\'s next',
                'body' => 'More fandoms are coming. When a second sport lands, this hub becomes a real chooser between them — for now, football is where the whole community stands together.',
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function rules(): array
    {
        return [
            'Be a good terrace neighbour — no harassment, hate speech, or targeted abuse of fans, players, or clubs.',
            'Rivalry is part of the game. Personal attacks aren\'t.',
            'No spam, bot activity, or farming points through automation.',
            'Predictions and polls are for fun — exploiting a bug to inflate points gets those points reversed.',
            'Report anything that breaks these rules from the post or profile it came from.',
        ];
    }
}
