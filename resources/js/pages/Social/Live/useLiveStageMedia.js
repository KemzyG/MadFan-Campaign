import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { fetchMediaToken } from './liveStageApi';

/**
 * LiveKit connection for a live Creator stage. One hook, two roles:
 *
 *  - host:   publishes camera + microphone once the stage is live.
 *  - viewer: subscribe-only — the token itself denies publish (see
 *            LiveKitMediaProvider::createViewerToken), so there's no
 *            client-side gate to bypass even with a modified client.
 *
 * Deliberately does NOT connect while the stage is merely `draft` — there is
 * no LiveKit room until the stage goes live (see LiveStageService::start,
 * now called in the same request as create() — see LiveStageController::
 * store), so connecting earlier would just fail.
 */
export function useLiveStageMedia({ stageId, isHost, isLive }) {
    const [mediaState, setMediaState] = useState('idle'); // idle | connecting | connected | reconnecting | disconnected | error
    const [mediaError, setMediaError] = useState(null);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [remoteVideoEl, setRemoteVideoEl] = useState(null);
    const [remoteAudioEl, setRemoteAudioEl] = useState(null);
    const [hostSpeaking, setHostSpeaking] = useState(false);
    const [localVideoEl, setLocalVideoEl] = useState(null);

    const roomRef = useRef(null);

    useEffect(() => {
        if (!stageId || !isLive) {
            return undefined;
        }

        let cancelled = false;
        // adaptiveStream pauses a video subscription until it sees its attached
        // element as visible/non-zero-size. VideoMount attaches LiveKit's
        // track.attach() element to the DOM only after React mounts it, so
        // adaptiveStream reads it as invisible at attach() time and never
        // requests layers — viewers get audio but no video, silently (same
        // root cause fixed for Stage voice in useStageLiveKitVoice.js).
        const room = new Room({ adaptiveStream: false, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.ConnectionStateChanged, (state) => {
            if (cancelled) return;
            if (state === 'connected') setMediaState('connected');
            else if (state === 'reconnecting') setMediaState('reconnecting');
            else if (state === 'disconnected') setMediaState('disconnected');
        });

        room.on(RoomEvent.TrackSubscribed, (track) => {
            if (cancelled) return;
            if (track.kind === Track.Kind.Video) {
                const el = track.attach();
                setRemoteVideoEl(el);
            } else if (track.kind === Track.Kind.Audio) {
                const el = track.attach();
                el.autoplay = true;
                setRemoteAudioEl(el);
            }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track) => {
            track.detach().forEach((el) => el.remove());
            if (track.kind === Track.Kind.Video) setRemoteVideoEl(null);
            if (track.kind === Track.Kind.Audio) setRemoteAudioEl(null);
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
            if (cancelled) return;
            setHostSpeaking(speakers.length > 0);
        });

        room.on(RoomEvent.LocalTrackPublished, (publication) => {
            if (cancelled) return;
            if (publication.kind === Track.Kind.Video && publication.track) {
                const el = publication.track.attach();
                setLocalVideoEl(el);
            }
        });

        room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
            if (publication.kind === Track.Kind.Video) {
                setLocalVideoEl(null);
            }
        });

        (async () => {
            setMediaState('connecting');
            try {
                const token = await fetchMediaToken(stageId);
                if (cancelled) return;
                await room.connect(token.url, token.token);
                if (cancelled) {
                    room.disconnect();
                    return;
                }
                if (isHost) {
                    await room.localParticipant.setMicrophoneEnabled(true);
                    await room.localParticipant.setCameraEnabled(true);
                }
                setMediaState('connected');
            } catch (err) {
                if (!cancelled) {
                    setMediaError(err.message || 'Could not connect to the live stream.');
                    setMediaState('error');
                }
            }
        })();

        return () => {
            cancelled = true;
            room.disconnect();
            roomRef.current = null;
        };
    }, [stageId, isHost, isLive]);

    const toggleCamera = useCallback(async () => {
        const room = roomRef.current;
        if (!room) return;
        const next = !cameraOn;
        await room.localParticipant.setCameraEnabled(next);
        setCameraOn(next);
    }, [cameraOn]);

    const toggleMic = useCallback(async () => {
        const room = roomRef.current;
        if (!room) return;
        const next = !micOn;
        await room.localParticipant.setMicrophoneEnabled(next);
        setMicOn(next);
    }, [micOn]);

    return {
        mediaState,
        mediaError,
        cameraOn,
        micOn,
        toggleCamera,
        toggleMic,
        localVideoEl,
        remoteVideoEl,
        remoteAudioEl,
        hostSpeaking,
    };
}
