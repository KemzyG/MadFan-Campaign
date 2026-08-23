import { router } from '@inertiajs/react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { useStageSession } from './StageSessionContext';
import { IconClose, IconPin } from './StageIcons';

/**
 * Pinned-message banner. The host can unpin; everyone sees the highlighted
 * message. Driven by `room.pinned_message` (see StageService::presentRoom).
 */
export default function PinnedMessage({ compact = false }) {
    const { room, patchRoom } = useStageSession();
    const { reportError } = useSocialFlash();

    const pinned = room?.pinned_message;
    if (!pinned) {
        return null;
    }

    const stageId = room?.stage?.id;
    const isHost = room?.me?.role === 'host';

    function unpin() {
        patchRoom((props) => ({ ...props, pinned_message: null }));
        router.post(
            `/social/stage/${stageId}/pin`,
            { message_id: '' },
            withRollbackFlash(reportError, { preserveState: true }),
        );
    }

    return (
        <div className={`mf-stage-pinned ${compact ? 'mf-stage-pinned--compact' : ''}`.trim()}>
            <span className="mf-stage-pinned__icon" aria-hidden>
                <IconPin active />
            </span>
            <div className="mf-stage-pinned__body min-w-0">
                <p className="mf-stage-pinned__kicker mf-mono">Pinned</p>
                <p className="mf-stage-pinned__text">
                    <span className="mf-stage-pinned__who">{pinned.user?.name || 'Fan'}</span>
                    {pinned.body}
                </p>
            </div>
            {isHost ? (
                <button
                    type="button"
                    className="mf-stage-icon-btn mf-stage-icon-btn--sm"
                    aria-label="Unpin message"
                    title="Unpin"
                    onClick={unpin}
                >
                    <IconClose />
                </button>
            ) : null}
        </div>
    );
}
