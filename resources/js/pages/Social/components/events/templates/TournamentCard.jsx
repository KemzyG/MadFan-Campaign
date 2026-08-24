import Crest from '../Crest';
import EventShell from '../EventShell';
import { IconClock } from '../icons';
import { formatKickoff } from '../time';

/**
 * tournament — the competition above the fixtures. Leads with the competition
 * name in display type, then a crest strip of everyone still involved and a
 * two-cell stat block (fixtures to play / how many are live).
 */
export default function TournamentCard({ event }) {
    const {
        competition,
        fixture_count: fixtures = 0,
        live_count: liveCount = 0,
        next_kickoff_at: nextKickoff,
        clubs = [],
    } = event.data || {};

    return (
        <EventShell event={event} tone="gold">
            <p className="mf-evcup__title">{competition || event.headline}</p>

            {clubs.length > 0 ? (
                <div className="mf-evcup__crests" aria-label="Clubs still involved">
                    {clubs.map((club) => (
                        <Crest key={club.id} club={club} size="sm" />
                    ))}
                </div>
            ) : null}

            <dl className="mf-evcup__stats">
                <div>
                    <dt>To play</dt>
                    <dd>{fixtures}</dd>
                </div>
                <div className={liveCount > 0 ? 'is-live' : ''}>
                    <dt>Live now</dt>
                    <dd>{liveCount}</dd>
                </div>
            </dl>

            {nextKickoff ? (
                <p className="mf-evcup__next">
                    <IconClock />
                    Next up {formatKickoff(nextKickoff)}
                </p>
            ) : null}
        </EventShell>
    );
}
