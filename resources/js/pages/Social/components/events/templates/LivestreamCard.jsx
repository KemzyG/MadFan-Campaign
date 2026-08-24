import AvatarStack from '../../post/AvatarStack';
import EventShell from '../EventShell';
import { formatCount } from '../../post/format';
import { useElapsed } from '../time';

/**
 * livestream — a live Stage with voice up, so somebody is actually broadcasting.
 * Reads as an on-air tile: animated equalizer, host line, speaker carousel and
 * a listener tally.
 */
export default function LivestreamCard({ event }) {
    const { stage, description, started_at: startedAt } = event.data || {};
    const minutes = useElapsed(startedAt);

    const speakers = stage?.speaker_count || 0;
    const listeners = Math.max(0, (stage?.participant_count || 0) - speakers);

    return (
        <EventShell event={event} tone="live">
            <div className="mf-evair">
                <span className="mf-evair__eq" aria-hidden>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                </span>
                <span className="mf-evair__badge">ON AIR</span>
                {minutes !== null ? (
                    <span className="mf-evair__elapsed">{minutes}m in</span>
                ) : null}
            </div>

            <p className="mf-evair__title">{stage?.title || event.headline}</p>

            {description ? <p className="mf-evair__desc">{description}</p> : null}

            {stage?.host ? (
                <p className="mf-evair__host">
                    Hosted by <b>{stage.host.name}</b>
                </p>
            ) : null}

            <div className="mf-evair__foot">
                <AvatarStack people={stage?.avatars} overflow={stage?.overflow_count} />
                <span className="mf-evair__counts">
                    {speakers > 0 ? <b>{speakers} on mic</b> : null}
                    {listeners > 0 ? <span>{formatCount(listeners)} listening</span> : null}
                </span>
            </div>
        </EventShell>
    );
}
