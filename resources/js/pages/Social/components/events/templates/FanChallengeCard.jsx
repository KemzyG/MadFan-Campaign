import EventShell from '../EventShell';
import { Countdown } from '../EventChrome';
import { IconCoin, IconExternal } from '../icons';

/**
 * fan_challenge — a task brief. The reward is the hero (a coin plate with the
 * points), the platform/type read as tags, and the deadline runs as a countdown
 * so the card pressures you the way a challenge should.
 */
export default function FanChallengeCard({ event }) {
    const {
        points = 0,
        platform,
        task_type: taskType,
        ends_at: endsAt,
        verification_required: needsProof,
        is_external: isExternal,
    } = event.data || {};

    const tags = [platform, taskType].filter(Boolean);

    return (
        <EventShell event={event} tone="pitch">
            <div className="mf-evtask">
                <div className="mf-evtask__reward" aria-label={`${points} points`}>
                    <IconCoin />
                    <b>{points}</b>
                    <span>pts</span>
                </div>

                <div className="mf-evtask__brief">
                    <p className="mf-evtask__title">{event.headline}</p>
                    {event.subtitle ? <p className="mf-evtask__desc">{event.subtitle}</p> : null}

                    {tags.length > 0 || needsProof || isExternal ? (
                        <div className="mf-evtask__tags">
                            {tags.map((tag) => (
                                <span key={tag} className="mf-evtask__tag">
                                    {tag.replace(/_/g, ' ')}
                                </span>
                            ))}
                            {needsProof ? (
                                <span className="mf-evtask__tag is-proof">proof needed</span>
                            ) : null}
                            {isExternal ? (
                                <span className="mf-evtask__tag is-external">
                                    <IconExternal />
                                    off-app
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            {endsAt ? <Countdown to={endsAt} label="Closes in" /> : null}
        </EventShell>
    );
}
