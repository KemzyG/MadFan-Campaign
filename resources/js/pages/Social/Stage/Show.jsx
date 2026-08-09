import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { StageRoomSkeleton } from '../components/Skeletons';
import { useStageSession } from './StageSessionContext';

/**
 * Deep-link / join entry: loads room props, seeds StageSession, opens modal.
 * Page body is a light underlay — the interactive Stage UI lives in SocialShell's modal.
 */
export default function Show(props) {
    const { stage } = props;
    const { enterFromPage, syncFromPage, reopen, modalOpen, activeStageId, minimize } = useStageSession();

    useEffect(() => {
        enterFromPage(props);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage?.id]);

    useEffect(() => {
        if (activeStageId && stage?.id && activeStageId === stage.id) {
            syncFromPage(props);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage, props.participants, props.messages, props.me, props.voice, activeStageId]);

    return (
        <SocialShell title="Stage" backHref="/social/stage" showTabs>
            <Head title={`${stage?.title || 'Stage'} · Mad Fan Stage`} />

            {stage == null ? (
                <StageRoomSkeleton />
            ) : (
                <div className="mf-stage-underlay">
                    <div className="mf-stage-underlay__card">
                        <div className="mf-stage-underlay__live">
                            {stage.status === 'live' ? <span className="mf-stage-live-dot" /> : null}
                            <span className="mf-text-caption text-[var(--mf-pitch)]">
                                {stage.status === 'live' ? 'You are in this stage' : 'Stage ended'}
                            </span>
                        </div>
                        <p className="mf-empty-title">{stage.title}</p>
                        <p className="mf-text-meta text-[var(--mf-muted)]">
                            {modalOpen
                                ? 'Room is open in the modal overlay. Minimize to keep listening while you browse.'
                                : 'Listening continues in the background. Reopen the stage anytime from the live pill.'}
                        </p>
                        <div className="mf-stage-underlay__actions">
                            {modalOpen ? (
                                <button type="button" className="mf-btn" onClick={minimize}>
                                    Minimize
                                </button>
                            ) : (
                                <button type="button" className="mf-btn mf-btn--pitch" onClick={reopen}>
                                    Reopen stage
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </SocialShell>
    );
}
