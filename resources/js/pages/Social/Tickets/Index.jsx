import { Head } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import SplitView from '../components/SplitView';
import { TicketListSkeleton } from '../components/Skeletons';
import TicketDetailModal from '../components/TicketDetailModal';
import MatchRow from './MatchRow';
import MatchDetail from './MatchDetail';

export default function Index({ matches }) {
    const [issuedTicket, setIssuedTicket] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const list = Array.isArray(matches) ? matches : [];
    const selectedMatch =
        list.find((match) => String(match.id) === String(selectedId)) || list[0] || null;

    function selectMatch(match) {
        setSelectedId(match.id);
        setDetailOpen(true);
    }

    const detailTitle = selectedMatch
        ? `${selectedMatch.home?.short || selectedMatch.home?.name} v ${selectedMatch.away?.short || selectedMatch.away?.name}`
        : undefined;

    return (
        <SocialShell title="Tickets" wide>
            <Head title="Match tickets — Mad Fan Social" />

            {matches == null ? (
                <div className="mf-ticket-page">
                    <TicketListSkeleton />
                </div>
            ) : (
                <div className="mf-ticket-page">
                    <div className="mf-ticket-page__bar">
                        <div>
                            <h1 className="mf-ticket-page__title mf-display">Box office</h1>
                            <p className="mf-ticket-page__sub mf-text-meta text-[var(--mf-muted)]">
                                General-admission passes for upcoming fixtures.
                            </p>
                        </div>
                    </div>

                    {list.length === 0 ? (
                        <div className="mf-empty mf-empty--compact">
                            <p className="mf-empty-title">Fixture board empty</p>
                            <p>Upcoming matches will land here when seeded.</p>
                        </div>
                    ) : (
                        <SplitView
                            mode="detail"
                            masterLabel="Fixture list"
                            detailLabel="Checkout"
                            detailOpen={detailOpen}
                            detailTitle={detailTitle}
                            onCloseDetail={() => setDetailOpen(false)}
                            master={
                                <div className="mf-ticket-rows">
                                    {list.map((match) => (
                                        <MatchRow
                                            key={match.id}
                                            match={match}
                                            selected={String(match.id) === String(selectedMatch?.id)}
                                            onSelect={selectMatch}
                                        />
                                    ))}
                                </div>
                            }
                            detail={
                                <div className="mf-split__detail-sticky">
                                    <MatchDetail match={selectedMatch} onIssued={setIssuedTicket} />
                                </div>
                            }
                        />
                    )}
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
