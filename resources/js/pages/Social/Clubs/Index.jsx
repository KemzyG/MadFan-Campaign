import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import SplitView from '../components/SplitView';
import LeagueTabs from './LeagueTabs';
import StandingsTable from './StandingsTable';
import ClubDetailCard from './ClubDetailCard';

export default function Index({
    leagues = [],
    table = null,
    filters = {},
    favourite_club_id: favouriteClubId = null,
}) {
    const rows = table?.rows || [];
    const activeLeagueId = filters.league_id ?? table?.league?.id ?? null;
    const leagueKey = table?.league?.id ?? null;

    const defaultRow = useMemo(() => {
        if (rows.length === 0) {
            return null;
        }
        if (favouriteClubId) {
            const fav = rows.find((row) => String(row.club.id) === String(favouriteClubId));
            if (fav) {
                return fav;
            }
        }
        return rows[0];
    }, [rows, favouriteClubId]);

    const [selectedId, setSelectedId] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Switching leagues swaps the whole table — drop the stale selection so the
    // detail falls back to the new league's default (favourite or leader).
    useEffect(() => {
        setSelectedId(null);
        setDetailOpen(false);
    }, [leagueKey]);

    const selectedRow =
        rows.find((row) => String(row.club.id) === String(selectedId)) || defaultRow;

    function setLeague(leagueId) {
        router.get(
            '/social/clubs',
            { league_id: leagueId === activeLeagueId ? undefined : leagueId },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function selectRow(row) {
        setSelectedId(row.club.id);
        setDetailOpen(true);
    }

    return (
        <SocialShell title="League table" wide>
            <Head title="League table — Mad Fan Social" />

            <div className="mf-club-page">
                <div className="mf-club-page__bar">
                    <LeagueTabs leagues={leagues} activeLeagueId={activeLeagueId} onSelect={setLeague} />
                </div>

                {table ? (
                    <SplitView
                        mode="detail"
                        masterLabel="League standings"
                        detailLabel="Club detail"
                        detailOpen={detailOpen}
                        detailTitle={selectedRow?.club?.name}
                        onCloseDetail={() => setDetailOpen(false)}
                        master={
                            <div className="mf-club-master mf-panel-card">
                                <header className="mf-panel-card__head">
                                    <div>
                                        <p className="mf-panel-card__title">{table.league.name}</p>
                                        <p className="mf-panel-card__hint">
                                            {rows.length} clubs
                                            {favouriteClubId ? ' · your club highlighted' : ''}
                                        </p>
                                    </div>
                                    <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">Tap a row</span>
                                </header>
                                <StandingsTable
                                    rows={rows}
                                    selectedClubId={selectedRow?.club?.id}
                                    onSelect={selectRow}
                                />
                                <p className="mf-club-legend mf-text-micro text-[var(--mf-muted)]">
                                    Top four and relegation markers follow standard league convention.
                                </p>
                            </div>
                        }
                        detail={
                            <div className="mf-split__detail-sticky">
                                <ClubDetailCard
                                    row={selectedRow}
                                    leagueSize={rows.length}
                                    leagueName={table.league.name}
                                />
                            </div>
                        }
                    />
                ) : (
                    <p className="mf-club-empty mf-text-meta text-[var(--mf-muted)]">
                        No standings available yet for this league.
                    </p>
                )}
            </div>
        </SocialShell>
    );
}
