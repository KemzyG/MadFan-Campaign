import { useEffect, useRef, useState } from 'react';
import StageAudioMenu from './StageAudioMenu';
import {
    IconChat,
    IconEnd,
    IconHand,
    IconLeave,
    IconMic,
    IconMicOff,
    IconReaction,
    IconSettings,
    IconShare,
    IconVoice,
    IconVolume,
    StageIconButton,
} from './StageIcons';
import { useStageActions } from './useStageActions';
import { useStageSession } from './StageSessionContext';

const FALLBACK_REACTIONS = ['🔥', '👏', '😂', '😮', '⚽', '💙'];

/**
 * The room's control row. Every action is optimistic (see useStageActions).
 * Mic/hand/reactions/audio/leave/end adapt to role and voice state; the chat,
 * settings and share buttons are mobile-only (desktop shows them elsewhere).
 */
export default function StageControlBar({ onOpenSettings, onOpenShare, onChat }) {
    const actions = useStageActions();
    const { chatUnread, audioOutput } = useStageSession();
    const [menu, setMenu] = useState(null); // 'audio' | 'react' | null
    const audioRef = useRef(null);
    const reactRef = useRef(null);

    useEffect(() => {
        if (!menu) {
            return undefined;
        }

        function onPointer(event) {
            const wrap = menu === 'audio' ? audioRef.current : reactRef.current;
            if (wrap && !wrap.contains(event.target)) {
                setMenu(null);
            }
        }
        function onKey(event) {
            if (event.key === 'Escape') {
                setMenu(null);
            }
        }

        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [menu]);

    if (!actions.stage) {
        return null;
    }

    const reactions = actions.reactionOptions.length ? actions.reactionOptions : FALLBACK_REACTIONS;
    const chatAllowed = actions.stage.allow_chat !== false;
    const inviteAllowed = actions.stage.allow_invite !== false;
    const isHost = actions.isHost;

    return (
        <div className="mf-stage-control-bar" role="toolbar" aria-label="Stage controls">
            <div className="mf-stage-control-bar__group">
                <div className="mf-stage-popover-anchor" ref={audioRef}>
                    <StageIconButton
                        label={`Audio output${audioOutput.deafened ? ' (deafened)' : ''}`}
                        active={menu === 'audio'}
                        danger={audioOutput.deafened}
                        aria-haspopup="dialog"
                        aria-expanded={menu === 'audio'}
                        onClick={() => setMenu((m) => (m === 'audio' ? null : 'audio'))}
                    >
                        <IconVolume />
                    </StageIconButton>
                    {menu === 'audio' ? (
                        <div className="mf-stage-popover mf-stage-popover--audio">
                            <StageAudioMenu />
                        </div>
                    ) : null}
                </div>

                {actions.canReact ? (
                    <div className="mf-stage-popover-anchor" ref={reactRef}>
                        <StageIconButton
                            label="React"
                            active={menu === 'react'}
                            aria-haspopup="menu"
                            aria-expanded={menu === 'react'}
                            onClick={() => setMenu((m) => (m === 'react' ? null : 'react'))}
                        >
                            <IconReaction />
                        </StageIconButton>
                        {menu === 'react' ? (
                            <div className="mf-stage-popover mf-stage-popover--react" role="menu">
                                {reactions.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className="mf-stage-react-btn"
                                        aria-label={`React ${emoji}`}
                                        onClick={() => {
                                            actions.react(emoji);
                                            setMenu(null);
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="mf-stage-control-bar__group mf-stage-control-bar__group--primary">
                {actions.canStartVoice ? (
                    <StageIconButton label="Start voice" pitch onClick={actions.startVoice}>
                        <IconVoice />
                    </StageIconButton>
                ) : null}

                {actions.micNeedsRecovery ? (
                    <StageIconButton label="Enable microphone" pitch onClick={actions.enableMic}>
                        <IconMic />
                    </StageIconButton>
                ) : null}

                {actions.canMute ? (
                    <StageIconButton
                        label={actions.me.is_muted ? 'Unmute microphone' : 'Mute microphone'}
                        active={!actions.me.is_muted}
                        pitch={!actions.me.is_muted}
                        onClick={actions.toggleMute}
                    >
                        {actions.me.is_muted ? <IconMicOff /> : <IconMic />}
                    </StageIconButton>
                ) : null}

                {actions.canRaiseHand ? (
                    <StageIconButton
                        label={actions.handRaised ? 'Hand raised' : 'Request to speak'}
                        active={actions.handRaised}
                        disabled={actions.handRaised}
                        onClick={actions.raiseHand}
                    >
                        <IconHand />
                    </StageIconButton>
                ) : null}
            </div>

            <div className="mf-stage-control-bar__group mf-stage-control-bar__group--mobile">
                {chatAllowed ? (
                    <StageIconButton
                        label={chatUnread > 0 ? `Chat, ${chatUnread} unread` : 'Chat'}
                        badge={chatUnread > 0 ? (chatUnread > 99 ? '99+' : chatUnread) : null}
                        onClick={onChat}
                    >
                        <IconChat />
                    </StageIconButton>
                ) : null}
                {isHost && actions.isLive ? (
                    <StageIconButton label="Stage settings" onClick={onOpenSettings}>
                        <IconSettings />
                    </StageIconButton>
                ) : null}
                {actions.isLive && actions.me && inviteAllowed ? (
                    <StageIconButton label="Share stage" onClick={onOpenShare}>
                        <IconShare />
                    </StageIconButton>
                ) : null}
            </div>

            <div className="mf-stage-control-bar__group mf-stage-control-bar__group--exit">
                {actions.canLeave ? (
                    <StageIconButton
                        label={isHost ? 'Leave stage' : 'Leave stage'}
                        onClick={actions.leave}
                    >
                        <IconLeave />
                    </StageIconButton>
                ) : null}
                {actions.canEnd ? (
                    <StageIconButton label="End stage for everyone" danger onClick={actions.endStage}>
                        <IconEnd />
                    </StageIconButton>
                ) : null}
            </div>
        </div>
    );
}
