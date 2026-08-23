import { Head, Link, router, usePoll } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import SplitView from '../components/SplitView';
import { TicketListSkeleton } from '../components/Skeletons';
import TicketDetailModal from '../components/TicketDetailModal';
import FixtureTabs from './FixtureTabs';
import FixtureGroups from './FixtureGroups';
import FixtureDetail from './FixtureDetail';

export default function Index({ tab = 'all', board, ticket_count = 0, poll_ms = 15000 }) {
    const [issuedTicket, setIssuedTicket] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    usePoll(poll_ms, { only: ['board'], preserveScroll: true });

    const rawCounts = board?.counts || { live: 0, today: 0, coming: 0, past: 0 };
    const comingCount = useMemo(
        () => (board?.coming || []).reduce((sum, day) => sum + (day.matches?.length || 0), 0),
        [board?.coming],
    );
    const counts = {
        all: rawCounts.live + rawCounts.today + comingCount + rawCounts.past,
        live: rawCounts.live,
        today: rawCounts.today,
        coming: comingCount,
        past: rawCounts.past,
    };

    // Matches visible under the current tab, in board order — the detail always
    // tracks something in the list the fan is actually looking at.
    const visibleMatches = useMemo(() => {
        if (!board) {
            return [];
        }
        const parts = [];
        if (tab === 'all' || tab === 'live') parts.push(...(board.live || []));
        if (tab === 'all' || tab === 'today') parts.push(...(board.today || []));
        if (tab === 'all' || tab === 'coming') {
            parts.push(...(board.coming || []).flatMap((day) => day.matches || []));
        }
        if (tab === 'all' || tab === 'past') parts.push(...(board.past || []));
        return parts;
    }, [board, tab]);

    const selectedMatch =
        visibleMatches.find((match) => String(match.id) === String(selectedId)) ||
        visibleMatches[0] ||
        null;

    function setTab(next) {
        router.get(
            '/social/fixtures',
            { tab: next === 'all' ? undefined : next },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function selectMatch(match) {
        setSelectedId(match.id);
        setDetailOpen(true);
    }

    const detailTitle = selectedMatch
        ? `${selectedMatch.home?.short || selectedMatch.home?.name} v ${selectedMatch.away?.short || selectedMatch.away?.name}`
        : undefined;

    return (
        <SocialShell title="Fixtures" wide>
            <Head title="Fixtures — Mad Fan Social" />

            {board == null ? (
                <div className="mf-fixture-page">
                    <TicketListSkeleton />
                </div>
            ) : (
                <div className="mf-fixture-page">
                    <div className="mf-fixture-page__bar">
                        <FixtureTabs tab={tab} counts={counts} onSelect={setTab} />
                        <div className="mf-page-links mf-page-links--end">
                            <Link href="/social/clubs" className="mf-tickets-mine-link" prefetch>
                                League table
                            </Link>
                            <Link href="/social/tickets" className="mf-tickets-mine-link" prefetch>
                                Box office
                            </Link>
                            <Link href="/social/tickets/mine" className="mf-tickets-mine-link" prefetch>
                                My tickets
                                {ticket_count > 0 ? (
                                    <span className="mf-mono mf-tickets-count">{ticket_count}</span>
                                ) : null}
                            </Link>
                        </div>
                    </div>

                    <SplitView
                        mode="detail"
                        masterLabel="Fixture list"
                        detailLabel="Fixture detail"
                        detailOpen={detailOpen}
                        detailTitle={detailTitle}
                        onCloseDetail={() => setDetailOpen(false)}
                        master={
                            <FixtureGroups
                                board={board}
                                tab={tab}
                                counts={counts}
                                selectedId={selectedMatch?.id}
                                onSelect={selectMatch}
                            />
                        }
                        detail={
                            <div className="mf-split__detail-sticky">
                                <FixtureDetail match={selectedMatch} onIssued={setIssuedTicket} />
                            </div>
                        }
                    />
                </div>
            )}

            <TicketDetailModal
                open={issuedTicket != null}
                ticketId={issuedTicket?.id}
                initialTicket={issuedTicket}
                onClose={() => setIssuedTicket(null)}
            />
        </SocialShell>
    );
}
