import { Link } from '@inertiajs/react';
import { formatLiveDuration } from './helpers';
import { useEffect, useState } from 'react';
import { IconLeave, IconMic, IconMicOff } from './StageIcons';
import { useStageActions } from './useStageActions';
import { useStageSession } from './StageSessionContext';

/**
 * Compact persistent dock shown only while joined and off the room route. Lets a
 * fan keep listening as they browse the rest of Social, with quick mute, a jump
 * back to the room, and leave — replacing the old minimised modal + FAB.
 */
export default function StageMiniDock() {
    const { room, activeStageId, isOnStageRoute } = useStageSession();
    const actions = useStageActions();
    const stage = room?.stage;
    const live = stage?.status === 'live';
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!live || !stage?.started_at || isOnStageRoute) {
            return undefined;
        }
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, [live, stage?.started_at, isOnStageRoute]);

    if (!room?.me || !stage || !live || isOnStageRoute) {
        return null;
    }

    return (
        <div className="mf-stage-dock" role="region" aria-label="Live stage">
            <Link href={`/social/stage/${activeStageId}`} className="mf-stage-dock__main">
                <span className="mf-stage-dock__pulse" aria-hidden>
                    <span className="mf-stage-live-dot" />
                </span>
                <span className="mf-stage-dock__copy min-w-0">
                    <span className="mf-stage-dock__title truncate">{stage.title}</span>
                    <span className="mf-stage-dock__meta mf-mono mf-text-micro">
                        {stage.started_at ? formatLiveDuration(stage.started_at, now) : 'Live'}
                        {' · tap to return'}
                    </span>
                </span>
            </Link>

            <div className="mf-stage-dock__actions">
                {actions.canMute ? (
                    <button
                        type="button"
                        className={`mf-stage-icon-btn ${actions.me?.is_muted ? '' : 'is-active is-pitch'}`.trim()}
                        aria-label={actions.me?.is_muted ? 'Unmute microphone' : 'Mute microphone'}
                        title={actions.me?.is_muted ? 'Unmute' : 'Mute'}
                        onClick={actions.toggleMute}
                    >
                        {actions.me?.is_muted ? <IconMicOff /> : <IconMic />}
                    </button>
                ) : null}
                {actions.canLeave ? (
                    <button
                        type="button"
                        className="mf-stage-icon-btn is-danger"
                        aria-label="Leave stage"
                        title="Leave stage"
                        onClick={actions.leave}
                    >
                        <IconLeave />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
