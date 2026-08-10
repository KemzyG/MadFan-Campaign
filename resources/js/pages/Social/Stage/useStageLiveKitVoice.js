/**
 * LiveKit SFU voice for Mad Fan Stage.
 * Media: livekit-client (publish mic when on stage; subscribe for everyone).
 * App events (promote / messages / room): Reverb — no mesh signaling needed.
 */
import { Room, RoomEvent, Track } from 'livekit-client';

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
}) {
    let room = null;
    let stopped = false;
    let connecting = false;
    let playbackUnlocked = false;
    let unlockAudioContext = null;
    let lastCanPublish = null;

    function setStatus(msg) {
        if (typeof onStatus === 'function') {
            onStatus(msg);
        }
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
        track.attach(audio);
        audio.muted = false;
        audio.volume = 1;
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

    function playRemoteAudio(audio) {
        if (!audio) {
            return Promise.resolve(false);
        }
        audio.muted = false;
        audio.volume = 1;
        const attempt = audio.play();
        if (attempt && typeof attempt.then === 'function') {
            return attempt
                .then(() => {
                    if (!iAmOnStage) {
                        setStatus('Hearing stage…');
                    }
                    return true;
                })
                .catch(() => {
                    if (!playbackUnlocked) {
                        setStatus('Tap “Tap to hear” to unlock audio');
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
            source.connect(ctx.destination);
            source.start(0);
        } catch (err) {
            console.warn('stage livekit audio unlock', err);
        }
    }

    function unlockPlayback() {
        playbackUnlocked = true;
        setStatus('Unlocking audio…');
        warmUnlockGestureSync();

        const audios = listRemoteAudios();
        if (!audios.length) {
            setStatus('Audio unlocked — waiting for speakers…');
            return Promise.resolve({ played: 0, failed: 0, pending: true });
        }

        return Promise.all(audios.map((audio) => playRemoteAudio(audio))).then((results) => {
            const played = results.filter(Boolean).length;
            const failed = results.length - played;
            if (played > 0) {
                setStatus(iAmOnStage ? 'Hearing peers…' : 'Hearing stage…');
            } else if (failed > 0) {
                setStatus('Browser blocked audio — tap Tap to hear again');
            } else {
                setStatus('Audio unlocked — waiting for speakers…');
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
            .on(RoomEvent.Disconnected, () => {
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
        try {
            await room.localParticipant.setMicrophoneEnabled(!isMuted);
            setStatus(isMuted ? 'Mic muted' : 'Mic live');
        } catch (err) {
            console.warn('livekit mic', err);
            setStatus('Mic permission denied');
        }
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
                    audioCaptureDefaults: {
                        echoCancellation: true,
                        noiseSuppression: true,
                    },
                });
                wireRoom(room);
                await room.connect(payload.url, payload.token);
                lastCanPublish = payload.can_publish;
            }

            await applyPublishState();
            if (!iAmOnStage && !playbackUnlocked) {
                setStatus('Connected — tap Tap to hear');
            }
        } catch (err) {
            console.warn('livekit connect', err);
            setStatus('Voice connect failed — retrying…');
            await disconnectRoom();
            if (!stopped && voiceEnabled) {
                window.setTimeout(() => {
                    void connect();
                }, 2500);
            }
        } finally {
            connecting = false;
        }
    }

    function start() {
        if (stopped) {
            return;
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
            // Publish grant lives in the JWT — reconnect for promote/demote.
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

    // Mesh API surface compatibility (signals unused for LiveKit).
    async function ingestSignals() {}

    return {
        start,
        stop,
        update,
        applyMute,
        ingestSignals,
        unlockPlayback,
        driver: 'livekit',
    };
}
