import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StageRoomSkeleton } from '../components/Skeletons';
import StageChatModal from './StageChatModal';
import { IconMinimize } from './StageIcons';
import { useStageSessionOptional } from './StageSessionContext';
import StageRoom from './StageRoom';

function StageFab({ stage, voiceStatus, onOpen }) {
    const hostName = stage?.host?.name || 'Host';
    const title = stage?.title || 'Live stage';

    return (
        <button
            type="button"
            className="mf-stage-fab"
            onClick={onOpen}
            aria-label={`Return to live stage: ${title}`}
        >
            <span className="mf-stage-fab__pulse" aria-hidden>
                <span className="mf-stage-live-dot" />
            </span>
            <span className="mf-stage-fab__copy">
                <span className="mf-stage-fab__kicker mf-mono">Live</span>
                <span className="mf-stage-fab__title">{title}</span>
                <span className="mf-stage-fab__meta mf-text-meta">
                    {hostName}
                    {voiceStatus && voiceStatus !== 'Idle' ? ` · ${voiceStatus}` : ''}
                </span>
            </span>
            <span className="mf-stage-fab__chev" aria-hidden>
                ↑
            </span>
        </button>
    );
}

function StageModal({ stageTitle, onMinimize, chatOpen, onCloseChat, children }) {
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    useEffect(() => {
        function onKey(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                if (chatOpen) {
                    onCloseChat();
                    return;
                }
                onMinimize();
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onMinimize, chatOpen, onCloseChat]);

    return (
        <div className="mf-stage-modal" role="dialog" aria-modal="true" aria-label={stageTitle || 'Stage'}>
            <button
                type="button"
                className="mf-stage-modal__backdrop"
                aria-label="Minimize stage and keep listening"
                onClick={onMinimize}
            />
            <div className="mf-stage-modal__panel">
                <div className="mf-stage-modal__chrome">
                    <div className="mf-stage-modal__brand">
                        <span className="mf-stage-live-dot" aria-hidden />
                        <span className="mf-display mf-stage-modal__brand-label">Stage</span>
                    </div>
                    <button type="button" className="mf-stage-icon-btn mf-stage-modal__close" aria-label="Minimize and keep listening" title="Minimize" onClick={onMinimize}>
                        <IconMinimize />
                    </button>
                </div>
                <div className="mf-stage-modal__body">{children}</div>
            </div>
        </div>
    );
}

/**
 * Shell overlay: full Stage modal when open, right-side FAB when minimized.
 * Mounted from SocialShell so it sits above app chrome; session/voice lives in provider.
 */
export default function StageChrome() {
    const session = useStageSessionOptional();

    if (!session?.activeStageId) {
        return null;
    }

    const { modalOpen, minimized, room, voiceStatus, reopen, minimize, loading, chatOpen, closeChat } =
        session;
    const stage = room?.stage;

    const node = (
        <>
            {modalOpen ? (
                <StageModal
                    stageTitle={stage?.title}
                    onMinimize={minimize}
                    chatOpen={chatOpen}
                    onCloseChat={closeChat}
                >
                    {loading || !stage ? <StageRoomSkeleton /> : <StageRoom />}
                </StageModal>
            ) : null}

            {modalOpen && chatOpen ? <StageChatModal onClose={closeChat} /> : null}

            {minimized && stage ? (
                <StageFab stage={stage} voiceStatus={voiceStatus} onOpen={reopen} />
            ) : null}
        </>
    );

    if (typeof document === 'undefined') {
        return node;
    }

    return createPortal(node, document.body);
}
