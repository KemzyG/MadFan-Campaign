import { useEffect, useRef } from 'react';
import { StageAvatar, roleLabel } from './helpers';
import { IconClose } from './StageIcons';
import { useStageSession } from './StageSessionContext';
import { voiceConnectionSummary } from './stageVoiceConnection';

/** Per-peer phase → short chip label. `connected` means transport up, audio not yet confirmed. */
const PHASE_TEXT = {
    connecting: 'Connecting',
    connected: 'Verifying',
    verified: 'Verified',
    failed: 'Blocked',
};

/**
 * Build the "Your connection" stepper. Speakers get a Microphone step; listeners
 * don't. The peer-facing steps are driven by the aggregate so they line up with
 * the per-speaker dots and the header pill.
 */
function deriveSteps({ onStage, status, agg }) {
    const s = String(status || '').toLowerCase();
    const steps = [];

    if (onStage) {
        let micState = 'pending';
        if (/mic (live|ready|muted)/.test(s)) {
            micState = 'done';
        } else if (/request|allow|connecting audio/.test(s)) {
            micState = 'active';
        } else if (/block|denied|not allowed|no mic|unsupported|tap anywhere/.test(s)) {
            micState = 'error';
        }
        steps.push({ key: 'mic', label: 'Microphone', state: micState });
    }

    let joinState = 'active';
    if (/stopped|idle|voice off|waiting for host/.test(s)) {
        joinState = 'pending';
    } else if (onStage ? /mic (live|ready|muted)/.test(s) : /hearing|verified/.test(s) || agg.total > 0) {
        joinState = 'done';
    }
    steps.push({ key: 'join', label: 'Joined voice', state: joinState });

    let connState;
    if (agg.total === 0) {
        connState = joinState === 'done' ? 'done' : 'pending';
    } else if (agg.anyFailed) {
        connState = 'error';
    } else if (agg.connecting === 0) {
        connState = 'done';
    } else {
        connState = 'active';
    }
    steps.push({
        key: 'connected',
        label: 'Speakers connected',
        state: connState,
        note: agg.total > 0 ? `${agg.total - agg.connecting}/${agg.total}` : null,
    });

    let verState;
    if (agg.total === 0) {
        verState = 'pending';
    } else if (agg.anyFailed) {
        verState = 'error';
    } else if (agg.allVerified) {
        verState = 'done';
    } else if (agg.verified > 0) {
        verState = 'active';
    } else {
        verState = 'pending';
    }
    steps.push({
        key: 'verified',
        label: 'Verified end-to-end',
        state: verState,
        note: agg.total > 0 ? `${agg.verified}/${agg.total}` : null,
    });

    return steps;
}

/**
 * Expandable panel opened from the header connection pill. Shows the local
 * user's connection steps and the live per-speaker connection state, so a fan
 * can see whether their voice is actually reaching everyone (and where it broke).
 */
export default function StageConnectionPanel({ onClose }) {
    const { room, voiceStatus, voiceConnection } = useStageSession();
    const rootRef = useRef(null);

    // Close on Escape, or on a pointer press anywhere outside the panel. The
    // toggle pill is treated as "inside" so its own click handles the toggle
    // (otherwise pointerdown-close + click-open would cancel out and reopen it).
    useEffect(() => {
        function onKey(event) {
            if (event.key === 'Escape') {
                onClose?.();
            }
        }
        function onPointerDown(event) {
            const target = event.target;
            if (rootRef.current?.contains(target)) {
                return;
            }
            if (typeof target?.closest === 'function' && target.closest('.mf-stage-conn-pill')) {
                return;
            }
            onClose?.();
        }
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointerDown, true);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointerDown, true);
        };
    }, [onClose]);

    const me = room?.me;
    const onStage = Boolean(me?.on_stage);
    const driver = room?.voice?.driver === 'livekit' ? 'livekit' : 'mesh';
    const agg = voiceConnection || { total: 0, verified: 0, peers: [] };
    const steps = deriveSteps({ onStage, status: voiceStatus, agg });

    const participants = room?.participants || [];
    const byId = new Map(participants.map((p) => [Number(p.user_id), p]));
    const listeningCount =
        room?.stage?.listener_count ??
        Math.max(0, (room?.stage?.participant_count ?? 0) - (room?.stage?.speaker_count ?? 0));

    return (
        <div
            ref={rootRef}
            className="mf-stage-conn-panel"
            role="dialog"
            aria-label="Voice connection details"
        >
            <header className="mf-stage-conn-panel__head">
                <p className="mf-stage-conn-panel__title">Voice connection</p>
                <button
                    type="button"
                    className="mf-stage-icon-btn mf-stage-conn-panel__close"
                    aria-label="Close"
                    onClick={onClose}
                >
                    <IconClose />
                </button>
            </header>

            <p className="mf-stage-conn-panel__summary mf-text-meta">
                {voiceConnectionSummary(agg)}
            </p>

            <ol className="mf-stage-conn-steps">
                {steps.map((step) => (
                    <li key={step.key} className={`mf-stage-conn-step is-${step.state}`}>
                        <span className="mf-stage-conn-step__dot" aria-hidden />
                        <span className="mf-stage-conn-step__label">{step.label}</span>
                        {step.note ? (
                            <span className="mf-stage-conn-step__note mf-mono">{step.note}</span>
                        ) : null}
                    </li>
                ))}
            </ol>

            {onStage ? (
                <p className="mf-stage-conn-panel__broadcast mf-text-meta">
                    Broadcasting to {listeningCount} {listeningCount === 1 ? 'listener' : 'listeners'}.
                </p>
            ) : null}

            {agg.peers.length > 0 ? (
                <ul className="mf-stage-conn-peers" aria-label="Per-speaker connection">
                    {agg.peers.map((peer) => {
                        const participant = byId.get(Number(peer.userId));
                        const user = participant?.user;
                        const phase = peer.phase || 'connecting';
                        return (
                            <li key={peer.userId} className="mf-stage-conn-peer">
                                <StageAvatar user={user} size="xs" />
                                <span className="mf-stage-conn-peer__name min-w-0 truncate">
                                    {user?.name || 'Fan'}
                                    <span className="mf-stage-conn-peer__role mf-mono">
                                        {roleLabel(participant?.role)}
                                    </span>
                                </span>
                                <span className={`mf-stage-conn-peer__chip is-${phase} mf-mono`}>
                                    {peer.muted && phase === 'verified' ? 'Muted' : PHASE_TEXT[phase] || phase}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            <p className="mf-stage-conn-panel__foot mf-text-meta">
                {driver === 'livekit'
                    ? 'Audio runs on the LiveKit server; “verified” means your app is receiving each speaker’s live audio.'
                    : 'Peer-to-peer audio; “connected” means a direct link is up to each speaker.'}
            </p>
        </div>
    );
}
