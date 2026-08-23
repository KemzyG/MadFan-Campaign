/**
 * LiveKit SFU voice for Mad Fan Stage.
 * Media: livekit-client (publish mic when on stage; subscribe for everyone).
 * App events (promote / messages / room): Reverb — no mesh signaling needed.
 */
import { Room, RoomEvent, Track } from 'livekit-client';
import {
    describeMicError,
    requestStageMicrophone,
    STAGE_AUDIO_CONSTRAINTS,
} from './stageMicPermission';
import { effectiveVolume, subscribeAudioOutput } from './stageAudioOutput';

function csrfHeaders() {
    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    if (match) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(match[1]);
    }
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
        headers['X-CSRF-TOKEN'] = token;
    }
    return headers;
}

export function createStageLiveKitVoiceSession({
    stageId,
    myUserId,
    voiceEnabled,
    iAmOnStage,
    isMuted,
    onStatus,
    onActiveSpeakers,
}) {
    let room = null;
    let stopped = false;
    let connecting = false;
    let reconnectTimer = null;
    let playbackUnlocked = false;
    let unlockAudioContext = null;
    let lastCanPublish = null;
    let unsubscribeAudioOutput = null;
    /** After a hard mic deny, pause auto-retries until the user taps Enable microphone. */
    let micBlocked = false;

    function setStatus(msg) {
        if (typeof onStatus === 'function') {
            onStatus(msg);
        }
    }

    function emitActiveSpeakers(list) {
        if (typeof onActiveSpeakers !== 'function') {
            return;
        }
        const ids = (list || [])
            .map((participant) => Number(participant?.identity))
            .filter((id) => Number.isFinite(id));
        onActiveSpeakers(ids);
    }

    function audioElId(identity) {
        return `stage-remote-audio-${identity}`;
    }

    function attachRemoteTrack(identity, track) {
        const elId = audioElId(identity);
        let audio = document.getElementById(elId);
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = elId;
            audio.autoplay = true;
            audio.playsInline = true;
            audio.setAttribute('playsinline', '');
            audio.setAttribute('autoplay', '');
            audio.style.position = 'fixed';
            audio.style.width = '0';
            audio.style.height = '0';
            audio.style.opacity = '0';
            audio.style.pointerEvents = 'none';
            document.body.appendChild(audio);
        }
        const mediaTrack = track.mediaStreamTrack;
        const existingTracks = audio.srcObject?.getAudioTracks?.() || [];
        if (mediaTrack && existingTracks.some((t) => t.id === mediaTrack.id) && !audio.paused) {
            return;
        }
        track.attach(audio);
        audio.muted = false;
        audio.volume = effectiveVolume();
        playRemoteAudio(audio);
    }

    function detachRemote(identity) {
        const audio = document.getElementById(audioElId(identity));
        if (audio) {
            audio.srcObject = null;
            audio.remove();
        }
    }

    function listRemoteAudios() {
        return [...document.querySelectorAll('audio[id^="stage-remote-audio-"]')];
    }

    /** Re-apply the listener's chosen output volume (0 when deafened) to every remote element. */
    function applyOutputVolume() {
        const volume = effectiveVolume();
        listRemoteAudios().forEach((audio) => {
            audio.volume = volume;
        });
    }

    function playRemoteAudio(audio) {
        if (!audio) {
            return Promise.resolve(false);
        }
        audio.muted = false;
        audio.volume = effectiveVolume();
        if (!audio.paused && audio.srcObject) {
            playbackUnlocked = true;
            return Promise.resolve(true);
        }
        const attempt = audio.play();
        if (attempt && typeof attempt.then === 'function') {
            return attempt
                .then(() => {
                    playbackUnlocked = true;
                    if (!iAmOnStage) {
                        setStatus('Hearing stage…');
                    }
                    return true;
                })
                .catch(() => {
                    if (!playbackUnlocked) {
                        setStatus('Audio paused — tap anywhere to hear');
                    }
                    return false;
                });
        }
        return Promise.resolve(!audio.paused);
    }

    function ensureUnlockAudioContext() {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
            return null;
        }
        if (!unlockAudioContext || unlockAudioContext.state === 'closed') {
            unlockAudioContext = new Ctx();
        }
        return unlockAudioContext;
    }

    function warmUnlockGestureSync() {
        try {
            const ctx = ensureUnlockAudioContext();
            if (!ctx) {
                return;
            }
            if (ctx.state === 'suspended') {
                void ctx.resume();
            }
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.value = 0;
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start(0);
        } catch (err) {
            console.warn('stage livekit audio unlock', err);
        }
    }

    function unlockPlayback() {
        playbackUnlocked = true;
        warmUnlockGestureSync();

        const audios = listRemoteAudios();
        if (!audios.length) {
            if (!iAmOnStage) {
                setStatus('Connecting as listener…');
            }
            return Promise.resolve({ played: 0, failed: 0, pending: true });
        }

        return Promise.all(audios.map((audio) => playRemoteAudio(audio))).then((results) => {
            const played = results.filter(Boolean).length;
            const failed = results.length - played;
            if (played > 0) {
                setStatus(iAmOnStage ? 'Hearing peers…' : 'Hearing stage…');
            } else if (failed > 0) {
                setStatus('Audio paused — tap anywhere to hear');
            } else if (!iAmOnStage) {
                setStatus('Connecting as listener…');
            }
            return { played, failed, pending: false };
        });
    }

    async function fetchToken() {
        const res = await fetch(`/social/stage/${stageId}/livekit-token`, {
            credentials: 'same-origin',
            headers: csrfHeaders(),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`LiveKit token failed (${res.status}): ${text.slice(0, 120)}`);
        }
        return res.json();
    }

    function wireRoom(nextRoom) {
        nextRoom
            .on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
                if (track.kind !== Track.Kind.Audio) {
                    return;
                }
                attachRemoteTrack(participant.identity, track);
            })
            .on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
                track.detach();
                if (track.kind === Track.Kind.Audio) {
                    detachRemote(participant.identity);
                }
            })
            .on(RoomEvent.ParticipantDisconnected, (participant) => {
                detachRemote(participant.identity);
            })
            .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                emitActiveSpeakers(speakers);
            })
            .on(RoomEvent.Disconnected, () => {
                emitActiveSpeakers([]);
                if (!stopped && voiceEnabled) {
                    setStatus('Voice reconnecting…');
                }
            })
            .on(RoomEvent.Reconnected, () => {
                setStatus(iAmOnStage ? (isMuted ? 'Mic muted' : 'Mic live') : 'Hearing stage…');
            });
    }

    async function applyPublishState() {
        if (!room || stopped) {
            return;
        }
        if (!iAmOnStage || !voiceEnabled) {
            await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
            return;
        }
        if (micBlocked && !isMuted) {
            setStatus(describeMicError({ name: 'NotAllowedError' }).status);
            return;
        }
        try {
            await room.localParticipant.setMicrophoneEnabled(!isMuted);
            micBlocked = false;
            setStatus(isMuted ? 'Mic muted' : 'Mic live');
        } catch (err) {
            console.warn('livekit mic', err);
            const described = describeMicError(err);
            if (described.code === 'blocked') {
                micBlocked = true;
            }
            setStatus(described.status);
        }
    }

    function clearReconnectTimer() {
        if (reconnectTimer) {
            window.clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    }

    function scheduleReconnect(delayMs = 2500) {
        if (stopped || !voiceEnabled || reconnectTimer || connecting) {
            return;
        }
        reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            void connect();
        }, delayMs);
    }

    async function disconnectRoom() {
        if (room) {
            try {
                room.disconnect();
            } catch {
                // ignore
            }
            room = null;
        }
        listRemoteAudios().forEach((audio) => {
            audio.srcObject = null;
            audio.remove();
        });
        emitActiveSpeakers([]);
        lastCanPublish = null;
    }

    async function connect() {
        if (stopped || !voiceEnabled || connecting) {
            return;
        }
        connecting = true;
        setStatus(iAmOnStage ? 'Connecting stage…' : 'Connecting as listener…');
        try {
            const payload = await fetchToken();
            if (stopped || !voiceEnabled) {
                return;
            }

            // Role change (promote/demote) needs a fresh grant — reconnect.
            if (room && lastCanPublish !== null && lastCanPublish !== payload.can_publish) {
                await disconnectRoom();
            }

            if (!room) {
                room = new Room({
                    adaptiveStream: true,
                    dynacast: true,
                    audioCaptureDefaults: STAGE_AUDIO_CONSTRAINTS,
                });
                wireRoom(room);
                await room.connect(payload.url, payload.token);
                lastCanPublish = payload.can_publish;
            }

            await applyPublishState();
            if (!iAmOnStage) {
                listRemoteAudios().forEach((audio) => playRemoteAudio(audio));
            }
        } catch (err) {
            console.warn('livekit connect', err);
            setStatus('Voice connect failed — retrying…');
            await disconnectRoom();
            scheduleReconnect();
        } finally {
            connecting = false;
        }
    }

    function start() {
        if (stopped) {
            return;
        }
        if (!unsubscribeAudioOutput) {
            unsubscribeAudioOutput = subscribeAudioOutput(() => applyOutputVolume());
        }
        if (!voiceEnabled) {
            setStatus('Waiting for host to start voice');
            return;
        }
        void connect();
    }

    function stop() {
        stopped = true;
        playbackUnlocked = false;
        clearReconnectTimer();
        if (unsubscribeAudioOutput) {
            unsubscribeAudioOutput();
            unsubscribeAudioOutput = null;
        }
        emitActiveSpeakers([]);
        void disconnectRoom();
        if (unlockAudioContext) {
            try {
                unlockAudioContext.close();
            } catch {
                // ignore
            }
            unlockAudioContext = null;
        }
        setStatus('Voice stopped');
    }

    function update(next) {
        const prevOnStage = iAmOnStage;
        if (typeof next.voiceEnabled === 'boolean') {
            voiceEnabled = next.voiceEnabled;
        }
        if (typeof next.iAmOnStage === 'boolean') {
            iAmOnStage = next.iAmOnStage;
        }
        if (typeof next.isMuted === 'boolean') {
            isMuted = next.isMuted;
        }

        if (!voiceEnabled) {
            void disconnectRoom();
            setStatus('Voice off');
            return;
        }

        if (prevOnStage !== iAmOnStage && room) {
            clearReconnectTimer();
            void disconnectRoom().then(() => connect());
            return;
        }

        if (!room && !connecting && !stopped) {
            void connect();
            return;
        }

        void applyPublishState();
    }

    function applyMute() {
        void applyPublishState();
    }

    /**
     * Call from a trusted click so the browser may show the permission prompt
     * (or report a prior deny with a clear recovery status).
     */
    async function retryMicAccess() {
        if (stopped || !voiceEnabled || !iAmOnStage) {
            return { ok: false };
        }
        setStatus('Requesting microphone…');
        const result = await requestStageMicrophone({ keepStream: false });
        if (!result.ok) {
            if (result.error.code === 'blocked') {
                micBlocked = true;
            }
            setStatus(result.error.status);
            return result;
        }
        micBlocked = false;
        await applyPublishState();
        return { ok: true };
    }

    // Mesh API surface compatibility (signals unused for LiveKit).
    async function ingestSignals() {}

    return {
        start,
        stop,
        update,
        applyMute,
        ingestSignals,
        unlockPlayback,
        retryMicAccess,
        driver: 'livekit',
    };
}
