<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminLeaderboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeaderboardExportController extends Controller
{
    public function __invoke(Request $request, AdminLeaderboardService $leaderboard): StreamedResponse
    {
        Gate::authorize('viewDashboard');

        $rows = $leaderboard->exportRows(
            scope: $request->string('scope')->toString() ?: 'global',
            fandomId: $request->integer('fandom_id') ?: null,
            clubId: $request->integer('club_id') ?: null,
            leagueId: $request->integer('league_id') ?: null,
            seasonId: $request->integer('season_id') ?: null,
            limit: min($request->integer('limit', 500), 1000),
        );

        $filename = 'madfan-leaderboard-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Rank', 'Name', 'Email', 'Fan ID', 'Fandom', 'Club', 'Points', 'Loyalty', 'Streak']);
            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['rank'],
                    $row['name'],
                    $row['email'],
                    $row['fan_id'],
                    $row['fandom'],
                    $row['club'],
                    $row['points'],
                    $row['loyalty'],
                    $row['streak'],
                ]);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
