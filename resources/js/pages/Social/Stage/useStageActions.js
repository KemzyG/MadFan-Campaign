import { router } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { isMicBlockedStatus } from './stageMicPermission';
import { useStageSession } from './StageSessionContext';

/**
 * All room actions in one place so the control bar and the keyboard shortcuts
 * share a single optimistic implementation. Every mutation patches the room
 * immediately and rolls back through the shared Social flash on failure —
 * exactly the behaviour the old StageRoom.jsx had inline.
 */
export function useStageActions() {
    const {
        room,
        voiceStatus,
        patchRoom,
        clearSession,
        unlockVoicePlayback,
        retryMicAccess,
        pushReaction,
    } = useStageSession();
    const { reportError, clearError } = useSocialFlash();

    const stage = room?.stage;
    const me = room?.me;
    const stageId = stage?.id;
    const isLive = stage?.status === 'live';
    const isHost = me?.role === 'host';
    const onStage = Boolean(me?.on_stage);
    const voiceEnabled = Boolean(stage?.voice_enabled);
    const speakRequestsAllowed = stage?.allow_speak_requests !== false;
    const handRaised = Boolean(me?.speak_requested_at);
    const micNeedsRecovery = onStage && voiceEnabled && isLive && isMicBlockedStatus(voiceStatus);

    const flashVisit = useCallback(
        (options = {}) =>
            withRollbackFlash(reportError, {
                preserveState: true,
                ...options,
                onSuccess: (...args) => {
                    clearError();
                    options.onSuccess?.(...args);
                },
            }),
        [reportError, clearError],
    );

    const toggleMute = useCallback(() => {
        if (!onStage || !isLive || !voiceEnabled || !me) {
            return;
        }
        unlockVoicePlayback?.();
        const nextMuted = me.is_muted ? 0 : 1;
        if (nextMuted === 0) {
            void retryMicAccess?.();
        }
        patchRoom((props) => ({
            ...props,
            me: props.me ? { ...props.me, is_muted: Boolean(nextMuted) } : props.me,
            participants: (props.participants || []).map((p) =>
                p.user_id === me.user_id ? { ...p, is_muted: Boolean(nextMuted) } : p,
            ),
        }));
        router.post(`/social/stage/${stageId}/mute`, { muted: nextMuted }, flashVisit());
    }, [onStage, isLive, voiceEnabled, me, stageId, patchRoom, flashVisit, unlockVoicePlayback, retryMicAccess]);

    const raiseHand = useCallback(() => {
        if (me?.role !== 'listener' || !isLive || !speakRequestsAllowed || handRaised) {
            return;
        }
        const now = new Date().toISOString();
        patchRoom((props) => ({
            ...props,
            me: props.me ? { ...props.me, speak_requested_at: now } : props.me,
            participants: (props.participants || []).map((p) =>
                p.user_id === me.user_id ? { ...p, speak_requested_at: now } : p,
            ),
        }));
        router.post(`/social/stage/${stageId}/speak-request`, {}, flashVisit());
    }, [me, isLive, speakRequestsAllowed, handRaised, stageId, patchRoom, flashVisit]);

    // Network-only reaction send (no local animation). The FAB drives the local
    // burst itself per tap and throttles this, so combos don't spam the endpoint.
    const sendReaction = useCallback(
        (emoji) => {
            if (!emoji || !isLive || !me) {
                return;
            }
            router.post(
                `/social/stage/${stageId}/reactions`,
                { emoji },
                withRollbackFlash(reportError, { preserveState: true }),
            );
        },
        [isLive, me, stageId, reportError],
    );

    const react = useCallback(
        (emoji) => {
            if (!emoji || !isLive || !me) {
                return;
            }
            // Animate locally at once; the server echo is de-duped by seen-id in the session.
            pushReaction(emoji);
            sendReaction(emoji);
        },
        [isLive, me, pushReaction, sendReaction],
    );

    const startVoice = useCallback(() => {
        if (!isHost || !isLive || voiceEnabled) {
            return;
        }
        unlockVoicePlayback?.();
        void retryMicAccess?.();
        patchRoom((props) => ({
            ...props,
            stage: props.stage ? { ...props.stage, voice_enabled: true } : props.stage,
            voice: props.voice ? { ...props.voice, enabled: true } : props.voice,
            me: props.me ? { ...props.me, is_muted: false } : props.me,
        }));
        router.post(`/social/stage/${stageId}/voice`, {}, flashVisit());
    }, [isHost, isLive, voiceEnabled, stageId, patchRoom, flashVisit, unlockVoicePlayback, retryMicAccess]);

    const enableMic = useCallback(() => {
        void retryMicAccess?.();
    }, [retryMicAccess]);

    const leave = useCallback(() => {
        if (!isLive || !me) {
            return;
        }
        patchRoom((props) => ({
            ...props,
            me: null,
            participants: (props.participants || []).filter((p) => p.user_id !== me.user_id),
            stage: props.stage
                ? {
                      ...props.stage,
                      participant_count: Math.max(0, (props.stage.participant_count || 1) - 1),
                  }
                : props.stage,
        }));
        router.post(
            `/social/stage/${stageId}/leave`,
            {},
            flashVisit({ onSuccess: () => clearSession(), onFinish: () => clearSession() }),
        );
    }, [isLive, me, stageId, patchRoom, flashVisit, clearSession]);

    const endStage = useCallback(() => {
        if (!isHost || !isLive) {
            return;
        }
        patchRoom((props) => ({
            ...props,
            stage: props.stage ? { ...props.stage, status: 'ended', voice_enabled: false } : props.stage,
        }));
        router.post(
            `/social/stage/${stageId}/end`,
            {},
            flashVisit({ onSuccess: () => clearSession(), onFinish: () => clearSession() }),
        );
    }, [isHost, isLive, stageId, patchRoom, flashVisit, clearSession]);

    return useMemo(
        () => ({
            stage,
            me,
            isLive,
            isHost,
            onStage,
            voiceEnabled,
            handRaised,
            micNeedsRecovery,
            reactionOptions: room?.reaction_options || [],
            canMute: onStage && isLive && voiceEnabled,
            canRaiseHand: me?.role === 'listener' && isLive && speakRequestsAllowed,
            canStartVoice: isHost && isLive && !voiceEnabled,
            canReact: isLive && Boolean(me),
            canLeave: isLive && Boolean(me),
            canEnd: isHost && isLive,
            toggleMute,
            raiseHand,
            react,
            sendReaction,
            startVoice,
            enableMic,
            leave,
            endStage,
        }),
        [
            stage,
            me,
            isLive,
            isHost,
            onStage,
            voiceEnabled,
            handRaised,
            micNeedsRecovery,
            speakRequestsAllowed,
            room?.reaction_options,
            toggleMute,
            raiseHand,
            react,
            sendReaction,
            startVoice,
            enableMic,
            leave,
            endStage,
        ],
    );
}
