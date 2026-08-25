import { Head, Link, router } from '@inertiajs/react';
import { useCallback } from 'react';
import SocialShell from '../../Layouts/SocialShell';
import PullToRefresh from './components/PullToRefresh';
import { EventsSkeleton } from './components/Skeletons';
import EventCard from './components/events/EventCard';
import EventFilters from './components/events/EventFilters';
import LiveNowStrip from './components/events/LiveNowStrip';
import { useStageSessionOptional } from './Stage/StageSessionContext';

function EventsHead({ club, stages }) {
    return (
        <header className="mf-ev-head">
            <div className="mf-ev-head__top">
                <p className="mf-ev-head__kicker">
                    <span className="mf-ev-head__dot" aria-hidden />
                    What&apos;s happening now
                </p>

                {club ? (
                    <Link href={`/social/clubs/${club.id}`} className="mf-ev-head__club">
                        {club.logo_url ? <img src={club.logo_url} alt="" loading="lazy" /> : null}
                        <span>{club.name}</span>
                        {club.league ? <i>{club.league}</i> : null}
                    </Link>
                ) : null}
            </div>

            {stages?.length ? (
                <div className="mf-ev-head__live">
                    <p className="mf-ev-head__live-label">Live now</p>
                    <LiveNowStrip stages={stages} />
                </div>
            ) : null}
        </header>
    );
}

function EventsEmpty({ message }) {
    return (
        <div className="mf-empty mf-empty--events">
            <div className="mf-empty-mark" aria-hidden>
                <span className="mf-empty-beam" />
                <span className="mf-empty-beam mf-empty-beam--late" />
            </div>
            <p className="mf-empty-title">Floodlights off</p>
            <p>{message}</p>
            <Link href="/social/feed" className="mf-btn mf-btn--pitch mt-5">
                Go to the feed
            </Link>
        </div>
    );
}

function EventStream({ events, filters, activeFilter, club }) {
    const stageSession = useStageSessionOptional();

    const cards = events?.data || [];
    const liveStages = cards
        .filter((event) => event.phase === 'live' && (event.type === 'livestream' || event.type === 'live_event'))
        .map((event) => event.data?.stage)
        .filter(Boolean);
    const ptrDisabled = Boolean(stageSession?.modalOpen || stageSession?.chatOpen);

    const refreshEvents = useCallback(() => new Promise((resolve) => {
        router.reload({
            only: ['events', 'filters'],
            preserveScroll: true,
            preserveState: true,
            onFinish: () => resolve(),
        });
    }), []);

    return (
        <PullToRefresh onRefresh={refreshEvents} disabled={ptrDisabled}>
            <div className="mf-page mf-events">
                <EventsHead club={club} stages={liveStages} />

                <EventFilters filters={filters} active={activeFilter} />

                {cards.length === 0 ? (
                    <EventsEmpty message={events?.empty_message} />
                ) : (
                    <div className="mf-ev-stream" role="feed" aria-label="Live and upcoming events">
                        {cards.map((event, index) => (
                            <div
                                key={event.key}
                                className="mf-ev-item"
                                style={{ '--mf-stagger': `${Math.min(index, 8) * 28}ms` }}
                            >
                                <EventCard event={event} />
                            </div>
                        ))}

                        {events?.links?.next ? (
                            <div className="mf-feed-more">
                                <Link
                                    href={events.links.next}
                                    className="mf-btn mf-btn--ghost"
                                    preserveScroll
                                >
                                    Load more
                                </Link>
                            </div>
                        ) : (
                            <p className="mf-feed-end mf-text-caption text-[var(--mf-muted)]">
                                That&apos;s everything happening · for now
                            </p>
                        )}
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}

export default function Events({ club, events, filters, active_filter: activeFilter }) {
    return (
        <SocialShell title="Events">
            <Head title="Events" />
            {events == null ? (
                <EventsSkeleton />
            ) : (
                <EventStream
                    events={events}
                    filters={filters}
                    activeFilter={activeFilter}
                    club={club}
                />
            )}
        </SocialShell>
    );
}
