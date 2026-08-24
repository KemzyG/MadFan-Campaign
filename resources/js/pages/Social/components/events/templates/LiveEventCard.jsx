import AvatarStack from '../../post/AvatarStack';
import EventShell from '../EventShell';
import { formatCount } from '../../post/format';
import { IconMic } from '../icons';
import { IconUsers } from '../../post/icons';

/**
 * live_event — a live Stage with voice off: a text watch-along room rather than
 * a broadcast. Deliberately quieter than the livestream tile — a dashed "room"
 * frame, who's inside, and what the room allows.
 */
export default function LiveEventCard({ event }) {
    const { stage, description, allow_chat: allowChat, allow_speak_requests: allowSpeak } = event.data || {};
    const inside = stage?.participant_count || 0;

    return (
        <EventShell event={event} tone="ghost">
            <div className="mf-evroom">
                <div className="mf-evroom__frame">
                    <span className="mf-evroom__tag">
                        <IconUsers />
                        Watch-along room
                    </span>

                    <p className="mf-evroom__title">{stage?.title || event.headline}</p>

                    {description ? <p className="mf-evroom__desc">{description}</p> : null}

                    <div className="mf-evroom__people">
                        <AvatarStack people={stage?.avatars} overflow={stage?.overflow_count} max={5} />
                        <span>{formatCount(inside)} inside</span>
                    </div>
                </div>

                <ul className="mf-evroom__rules">
                    <li className={allowChat ? 'is-on' : ''}>{allowChat ? 'Chat open' : 'Chat closed'}</li>
                    <li className={allowSpeak ? 'is-on' : ''}>
                        <IconMic />
                        {allowSpeak ? 'Requests to speak welcome' : 'Listening only'}
                    </li>
                </ul>
            </div>
        </EventShell>
    );
}
