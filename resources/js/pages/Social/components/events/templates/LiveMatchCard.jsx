import Crest from '../Crest';
import EventShell from '../EventShell';
import { Countdown, LiveClock } from '../EventChrome';
import { IconPin } from '../icons';
import { formatKickoff } from '../time';

/**
 * live_match — a scoreboard slab. Crest · VS · crest, with a live minute clock
 * when the fixture is in play and a kick-off countdown when it isn't.
 *
 * `match_fixtures` has no goals column, so there is deliberately no scoreline.
 */
export default function LiveMatchCard({ event }) {
    const { home, away, kickoff_at: kickoff, venue, competition, is_live: live } = event.data || {};

    return (
        <EventShell event={event} tone={live ? 'live' : 'pitch'}>
            <div className="mf-evmatch">
                <div className="mf-evmatch__side">
                    <Crest club={home} size="lg" />
                    <span className="mf-evmatch__name">{home?.short || home?.name || 'Home'}</span>
                </div>

                <div className="mf-evmatch__center">
                    {live ? (
                        <>
                            <LiveClock since={kickoff} />
                            <span className="mf-evmatch__inplay">in play</span>
                        </>
                    ) : (
                        <>
                            <span className="mf-evmatch__vs">VS</span>
                            <span className="mf-evmatch__kickoff">{formatKickoff(kickoff)}</span>
                        </>
                    )}
                </div>

                <div className="mf-evmatch__side">
                    <Crest club={away} size="lg" />
                    <span className="mf-evmatch__name">{away?.short || away?.name || 'Away'}</span>
                </div>
            </div>

            {!live ? <Countdown to={kickoff} label="Kick-off in" /> : null}

            <p className="mf-evmatch__meta">
                {competition ? <span className="mf-evmatch__comp">{competition}</span> : null}
                {venue ? (
                    <span className="mf-evmatch__venue">
                        <IconPin />
                        {venue}
                    </span>
                ) : null}
            </p>
        </EventShell>
    );
}
