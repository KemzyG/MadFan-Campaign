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
        videoTracks,
        presentationState,
        toggleCamera: toggleCameraPublish,
        toggleScreenShare: toggleScreenSharePublish,
        startPresentation: startPresentationSession,
        stopPresentation: stopPresentationSession,
        presentationPlay: presentationPlaySession,
        presentationPause: presentationPauseSession,
        presentationSeek: presentationSeekSession,
        getPresentationCanvas,
        setPresentationDrawing,
        presentationClearDrawing,
        presentationPointerDown,
        presentationPointerMove,
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
    // Mirrors StageVoice::publishSourcesFor server-side: Video stages let any
    // on-stage participant publish camera/screen; Streaming stages reserve it
    // for the host — a promoted Streaming speaker still only gets voice/chat.
    // Real enforcement is the LiveKit token's canPublishSources; this is UI gating only.
    const stageType = stage?.type || 'voice';
    const canPublishVideo =
        onStage && isLive && voiceEnabled && stageType !== 'voice' && (stageType === 'video' || isHost);
    const cameraOn = Boolean(me && videoTracks.get(`${me.user_id}:camera`));
    const screenShareOn = Boolean(me && videoTracks.get(`${me.user_id}:screen_share`));
    // Host-only for v1 — presenting is a single-broadcaster affordance (like
    // handing round one shared screen), so it doesn't extend to Video-type
    // co-speakers the way camera/screen does, even though they can go on camera.
    const canPresent = isHost && canPublishVideo;
    const presenting = Boolean(presentationState);

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
        const rollback = patchRoom((props) => ({
            ...props,
            me: props.me ? { ...props.me, is_muted: Boolean(nextMuted) } : props.me,
            participants: (props.participants || []).map((p) =>
                p.user_id === me.user_id ? { ...p, is_muted: Boolean(nextMuted) } : p,
            ),
        }));
        router.post(`/social/stage/${stageId}/mute`, { muted: nextMuted }, flashVisit({ rollback }));
    }, [onStage, isLive, voiceEnabled, me, stageId, patchRoom, flashVisit, unlockVoicePlayback, retryMicAccess]);

    const raiseHand = useCallback(() => {
        if (me?.role !== 'listener' || !isLive || !speakRequestsAllowed || handRaised) {
            return;
        }
        const now = new Date().toISOString();
        const rollback = patchRoom((props) => ({
            ...props,
            me: props.me ? { ...props.me, speak_requested_at: now } : props.me,
            participants: (props.participants || []).map((p) =>
                p.user_id === me.user_id ? { ...p, speak_requested_at: now } : p,
            ),
        }));
        router.post(`/social/stage/${stageId}/speak-request`, {}, flashVisit({ rollback }));
    }, [me, isLive, speakRequestsAllowed, handRaised, stageId, patchRoom, flashVisit]);

    // Claiming an open seat outright — a listener tapping an empty slot on the
    // deck, no host approval needed (unlike raiseHand above).
    const seatsFull = (stage?.speaker_count ?? 0) >= (stage?.max_speakers ?? Infinity);
    const canTakeSeat = me?.role === 'listener' && isLive && !seatsFull;
    const takeSeat = useCallback(() => {
        if (me?.role !== 'listener' || !isLive) {
            return;
        }
        const rollback = patchRoom((props) => ({
            ...props,
            me: props.me
                ? { ...props.me, role: 'speaker', on_stage: true, speak_requested_at: null, is_muted: true }
                : props.me,
            participants: (props.participants || []).map((p) =>
                p.user_id === me.user_id
                    ? { ...p, role: 'speaker', on_stage: true, speak_requested_at: null, is_muted: true }
                    : p,
            ),
            stage: props.stage
                ? { ...props.stage, speaker_count: (props.stage.speaker_count || 0) + 1 }
                : props.stage,
        }));
        router.post(`/social/stage/${stageId}/take-seat`, {}, flashVisit({ rollback }));
    }, [me, isLive, stageId, patchRoom, flashVisit]);

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
        const rollback = patchRoom((props) => ({
            ...props,
            stage: props.stage ? { ...props.stage, voice_enabled: true } : props.stage,
            voice: props.voice ? { ...props.voice, enabled: true } : props.voice,
            me: props.me ? { ...props.me, is_muted: false } : props.me,
        }));
        router.post(`/social/stage/${stageId}/voice`, {}, flashVisit({ rollback }));
    }, [isHost, isLive, voiceEnabled, stageId, patchRoom, flashVisit, unlockVoicePlayback, retryMicAccess]);

    const enableMic = useCallback(() => {
        void retryMicAccess?.();
    }, [retryMicAccess]);

    const toggleCamera = useCallback(() => {
        if (!canPublishVideo) {
            return;
        }
        unlockVoicePlayback?.();
        void toggleCameraPublish?.(!cameraOn);
    }, [canPublishVideo, cameraOn, toggleCameraPublish, unlockVoicePlayback]);

    const toggleScreenShare = useCallback(() => {
        if (!canPublishVideo) {
            return;
        }
        unlockVoicePlayback?.();
        void toggleScreenSharePublish?.(!screenShareOn);
    }, [canPublishVideo, screenShareOn, toggleScreenSharePublish, unlockVoicePlayback]);

    const startPresentation = useCallback(
        (file) => {
            if (!canPresent || !file) {
                return;
            }
            unlockVoicePlayback?.();
            void startPresentationSession?.(file);
        },
        [canPresent, startPresentationSession, unlockVoicePlayback],
    );

    const stopPresentation = useCallback(() => {
        void stopPresentationSession?.();
    }, [stopPresentationSession]);

    const presentationPlay = useCallback(() => {
        presentationPlaySession?.();
    }, [presentationPlaySession]);

    const presentationPause = useCallback(() => {
        presentationPauseSession?.();
    }, [presentationPauseSession]);

    const presentationSeek = useCallback(
        (seconds) => {
            presentationSeekSession?.(seconds);
        },
        [presentationSeekSession],
    );

    const leave = useCallback(() => {
        if (!isLive || !me) {
            return;
        }
        const rollback = patchRoom((props) => ({
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
            flashVisit({ rollback, onSuccess: () => clearSession(), onFinish: () => clearSession() }),
        );
    }, [isLive, me, stageId, patchRoom, flashVisit, clearSession]);

    const endStage = useCallback(() => {
        if (!isHost || !isLive) {
            return;
        }
        const rollback = patchRoom((props) => ({
            ...props,
            stage: props.stage ? { ...props.stage, status: 'ended', voice_enabled: false } : props.stage,
        }));
        router.post(
            `/social/stage/${stageId}/end`,
            {},
            flashVisit({ rollback, onSuccess: () => clearSession(), onFinish: () => clearSession() }),
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
            canTakeSeat,
            takeSeat,
            canStartVoice: isHost && isLive && !voiceEnabled,
            canReact: isLive && Boolean(me),
            canLeave: isLive && Boolean(me),
            canEnd: isHost && isLive,
            canPublishVideo,
            cameraOn,
            screenShareOn,
            canPresent,
            presenting,
            presentationState,
            getPresentationCanvas,
            setPresentationDrawing,
            presentationClearDrawing,
            presentationPointerDown,
            presentationPointerMove,
            toggleMute,
            raiseHand,
            takeSeat,
            react,
            sendReaction,
            startVoice,
            enableMic,
            toggleCamera,
            toggleScreenShare,
            startPresentation,
            stopPresentation,
            presentationPlay,
            presentationPause,
            presentationSeek,
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
            canTakeSeat,
            room?.reaction_options,
            canPublishVideo,
            cameraOn,
            screenShareOn,
            canPresent,
            presenting,
            presentationState,
            getPresentationCanvas,
            setPresentationDrawing,
            presentationClearDrawing,
            presentationPointerDown,
            presentationPointerMove,
            toggleMute,
            raiseHand,
            takeSeat,
            react,
            sendReaction,
            startVoice,
            enableMic,
            toggleCamera,
            toggleScreenShare,
            startPresentation,
            stopPresentation,
            presentationPlay,
            presentationPause,
            presentationSeek,
            leave,
            endStage,
        ],
    );
}
