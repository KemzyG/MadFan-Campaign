/**
 * LiveKit SFU voice for Mad Fan Stage.
 * Media: livekit-client (publish mic when on stage; subscribe for everyone).
 * App events (promote / messages / room): Reverb — no mesh signaling needed.
 */
import { ConnectionQuality, Room, RoomEvent, Track } from 'livekit-client';
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
    onPeerState,
    onVideoTrack,
    onPresentationState,
}) {
    let room = null;
    /** Per remote speaker: last emitted connection state, keyed by numeric identity (user_id). */
    const peers = new Map();
    /** Live `<video>` elements for camera/screen-share tracks, keyed `${identity}:${source}`
     *  — kept alive here (not React state) since a raw MediaStreamTrack needs a real DOM
     *  element to attach to; components pull them out via `getVideoElement()` and mount
     *  into their own tile via a ref, same interop pattern as the hidden `<audio>` elements. */
    const videoElements = new Map();
    /**
     * Presentation mode ("upload a video and share it, with drawing"): a hidden
     * `<video>` plays the host's local file (never uploaded anywhere — the file
     * never needs to leave their browser), a `<canvas>` redraws it every frame
     * plus any annotation strokes on top, and canvas.captureStream() is what
     * actually gets published — so drawing and playback state need no separate
     * sync channel at all: viewers are just watching the composited canvas as
     * an ordinary screen-share video track, frame for frame, already in sync.
     * `points` holds committed strokes as arrays of {x,y} in canvas pixel space.
     */
    let presentation = null;
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

    // --- Per-peer connection state (drives the header pill + connection panel) ----
    // On an SFU every remote is receive-only from my side (I subscribe to them);
    // "they hear me" is the server accepting my published track, tracked at the
    // room level rather than per remote peer, so `tx` stays null here.

    function mapQuality(quality) {
        switch (quality) {
            case ConnectionQuality.Excellent:
            case ConnectionQuality.Good:
                return 'good';
            case ConnectionQuality.Poor:
                return 'poor';
            case ConnectionQuality.Lost:
                return 'lost';
            default:
                return null;
        }
    }

    /** LiveKit identity == user_id for every participant, including me. */
    function isMe(identity) {
        return Number(identity) === Number(myUserId);
    }

    function peerSig(state) {
        return `${state.phase}|${state.rx ? 1 : 0}|${state.muted ? 1 : 0}|${state.quality || ''}`;
    }

    /** Merge a patch into a peer's state and emit only when something changed. */
    function pushPeer(identity, patch) {
        if (typeof onPeerState !== 'function') {
            return;
        }
        const id = Number(identity);
        if (!Number.isFinite(id)) {
            return;
        }
        const prev = peers.get(id) || {
            phase: 'connecting',
            role: 'recv',
            rx: false,
            tx: null,
            muted: false,
            quality: null,
        };
        // Never regress out of `failed` on a stray late event; a fresh connect resets the map.
        const next = { ...prev, ...patch };
        if (peers.has(id) && peerSig(prev) === peerSig(next)) {
            peers.set(id, next);
            return;
        }
        peers.set(id, next);
        onPeerState(id, {
            phase: next.phase,
            role: next.role,
            rx: next.rx,
            tx: next.tx,
            muted: next.muted,
            quality: next.quality,
        });
    }

    function removePeer(identity) {
        const id = Number(identity);
        if (!Number.isFinite(id) || !peers.has(id)) {
            return;
        }
        peers.delete(id);
        if (typeof onPeerState === 'function') {
            onPeerState(id, null);
        }
    }

    function resetPeers() {
        if (typeof onPeerState === 'function') {
            for (const id of peers.keys()) {
                onPeerState(id, null);
            }
        }
        peers.clear();
    }

    /** Seed connection state from participants already in the room at connect time. */
    function seedPeersFromRoom(nextRoom) {
        nextRoom?.remoteParticipants?.forEach((participant) => {
            pushPeer(participant.identity, { phase: 'connecting' });
        });
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
            return Promise.resolve(true);
        }
        track.attach(audio);
        audio.muted = false;
        audio.volume = effectiveVolume();
        return playRemoteAudio(audio);
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

    function videoKey(identity, source) {
        return `${identity}:${source}`;
    }

    function trackSource(publication) {
        return publication?.source === Track.Source.ScreenShare ? 'screen_share' : 'camera';
    }

    /** Attach a camera/screen-share track to a (possibly reused) `<video>` element. */
    function attachVideoTrack(identity, source, track) {
        const key = videoKey(identity, source);
        let video = videoElements.get(key);
        if (!video) {
            video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            // Mute my own tiles so a local camera/screen preview never echoes
            // back through the room's own audio track.
            video.muted = isMe(identity);
            videoElements.set(key, video);
        }
        track.attach(video);
        return video;
    }

    function detachVideoTrack(identity, source) {
        const key = videoKey(identity, source);
        const video = videoElements.get(key);
        if (video) {
            video.srcObject = null;
            videoElements.delete(key);
        }
        if (typeof onVideoTrack === 'function') {
            onVideoTrack(Number(identity), source, null);
        }
    }

    /** Look up a live video element for a participant's camera or screen-share. */
    function getVideoElement(identity, source) {
        return videoElements.get(videoKey(identity, source)) || null;
    }

    /** Re-apply the listener's chosen output volume to every remote element. */
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
            .on(RoomEvent.ParticipantConnected, (participant) => {
                if (!isMe(participant.identity)) {
                    pushPeer(participant.identity, { phase: 'connecting' });
                }
            })
            .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === Track.Kind.Video) {
                    const source = trackSource(publication);
                    const video = attachVideoTrack(participant.identity, source, track);
                    if (typeof onVideoTrack === 'function') {
                        onVideoTrack(Number(participant.identity), source, video);
                    }
                    return;
                }
                if (track.kind !== Track.Kind.Audio) {
                    return;
                }
                const id = Number(participant.identity);
                const playing = attachRemoteTrack(participant.identity, track);
                if (publication?.isMuted) {
                    // Subscribed but muted at source = intentional silence, transport is up.
                    pushPeer(id, { phase: 'verified', rx: false, muted: true });
                    return;
                }
                pushPeer(id, { phase: 'connected', muted: false });
                playing.then((ok) => {
                    if (ok) {
                        // Audio element is actually playing their live track → end-to-end verified.
                        pushPeer(id, { phase: 'verified', rx: true });
                    }
                });
            })
            .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                track.detach();
                if (track.kind === Track.Kind.Video) {
                    detachVideoTrack(participant.identity, trackSource(publication));
                    return;
                }
                if (track.kind === Track.Kind.Audio) {
                    detachRemote(participant.identity);
                    pushPeer(participant.identity, { phase: 'connected', rx: false });
                }
            })
            .on(RoomEvent.LocalTrackPublished, (publication, participant) => {
                const track = publication?.track;
                if (!track || track.kind !== Track.Kind.Video) {
                    return;
                }
                const source = trackSource(publication);
                const video = attachVideoTrack(participant.identity, source, track);
                if (typeof onVideoTrack === 'function') {
                    onVideoTrack(Number(participant.identity), source, video);
                }
            })
            .on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
                if (publication?.kind !== Track.Kind.Video) {
                    return;
                }
                detachVideoTrack(participant.identity, trackSource(publication));
            })
            .on(RoomEvent.TrackMuted, (_publication, participant) => {
                if (isMe(participant.identity)) {
                    return;
                }
                const id = Number(participant.identity);
                const cur = peers.get(id);
                const upgraded = cur && (cur.phase === 'connected' || cur.phase === 'verified');
                pushPeer(id, { muted: true, rx: false, phase: upgraded ? 'verified' : cur?.phase || 'connecting' });
            })
            .on(RoomEvent.TrackUnmuted, (_publication, participant) => {
                if (!isMe(participant.identity)) {
                    pushPeer(participant.identity, { muted: false });
                }
            })
            .on(RoomEvent.ParticipantDisconnected, (participant) => {
                detachRemote(participant.identity);
                removePeer(participant.identity);
            })
            .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                emitActiveSpeakers(speakers);
                // A remote counted as an active speaker is provably sending audio the SFU
                // forwards to me — the strongest end-to-end proof available on an SFU.
                for (const participant of speakers || []) {
                    if (!isMe(participant?.identity)) {
                        pushPeer(participant.identity, { phase: 'verified', rx: true, muted: false });
                    }
                }
            })
            .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
                if (isMe(participant?.identity) || !peers.has(Number(participant?.identity))) {
                    return;
                }
                const mapped = mapQuality(quality);
                if (mapped === 'lost') {
                    pushPeer(participant.identity, { phase: 'failed', quality: 'lost' });
                } else {
                    pushPeer(participant.identity, { quality: mapped });
                }
            })
            .on(RoomEvent.Disconnected, () => {
                emitActiveSpeakers([]);
                resetPeers();
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
        await stopPresentationInternal();
        emitPresentationState();
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
        for (const [key, video] of videoElements) {
            video.srcObject = null;
            const [identity, source] = key.split(':');
            if (typeof onVideoTrack === 'function') {
                onVideoTrack(Number(identity), source, null);
            }
        }
        videoElements.clear();
        emitActiveSpeakers([]);
        resetPeers();
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
                    // adaptiveStream pauses a video subscription until it sees its
                    // attached element as visible/non-zero-size. Our video elements
                    // are created detached (in `videoElements`, a plain Map) and only
                    // get inserted into the real DOM afterwards by SpeakerTile's ref —
                    // so adaptiveStream reads them as invisible at attach() time and
                    // never requests layers, leaving viewers with audio but no video
                    // and no error. dynacast (server-side unused-layer skipping) has
                    // no such attach-timing dependency, so it stays on.
                    adaptiveStream: false,
                    dynacast: true,
                    audioCaptureDefaults: STAGE_AUDIO_CONSTRAINTS,
                });
                wireRoom(room);
                await room.connect(payload.url, payload.token);
                lastCanPublish = payload.can_publish;
                seedPeersFromRoom(room);
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

    /** Toggle my own camera publish. No-op (fails closed) if the token doesn't grant it. */
    async function setCameraEnabled(enabled) {
        if (!room || stopped) {
            return { ok: false };
        }
        try {
            await room.localParticipant.setCameraEnabled(enabled);
            return { ok: true };
        } catch (err) {
            console.warn('livekit camera', err);
            return { ok: false, error: err };
        }
    }

    /** Toggle my own screen-share publish (browser's own picker UI, via getDisplayMedia). */
    async function setScreenShareEnabled(enabled) {
        if (!room || stopped) {
            return { ok: false };
        }
        try {
            await room.localParticipant.setScreenShareEnabled(enabled);
            return { ok: true };
        } catch (err) {
            console.warn('livekit screen share', err);
            return { ok: false, error: err };
        }
    }

    function emitPresentationState() {
        if (typeof onPresentationState !== 'function') {
            return;
        }
        if (!presentation) {
            onPresentationState(null);
            return;
        }
        const { video, drawing } = presentation;
        onPresentationState({
            playing: !video.paused && !video.ended,
            currentTime: video.currentTime || 0,
            duration: Number.isFinite(video.duration) ? video.duration : 0,
            drawing,
        });
    }

    function drawArrowhead(ctx, from, to, size) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    function presentationDrawFrame() {
        if (!presentation) {
            return;
        }
        const { video, canvas, ctx, points } = presentation;
        if (video.readyState >= 2) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#ff5470';
        ctx.lineWidth = Math.max(3, canvas.width * 0.004);
        for (const stroke of points) {
            if (stroke.length < 2) {
                continue;
            }
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i += 1) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.stroke();
            drawArrowhead(ctx, stroke[stroke.length - 2], stroke[stroke.length - 1], canvas.width * 0.018);
        }

        presentation.rafId = window.requestAnimationFrame(presentationDrawFrame);
    }

    async function stopPresentationInternal() {
        if (!presentation) {
            return;
        }
        const { video, rafId, videoPublication, audioPublication } = presentation;
        presentation = null;
        if (rafId) {
            window.cancelAnimationFrame(rafId);
        }
        try {
            if (videoPublication) {
                await room?.localParticipant.unpublishTrack(videoPublication.track);
            }
        } catch (err) {
            console.warn('presentation unpublish video', err);
        }
        try {
            if (audioPublication) {
                await room?.localParticipant.unpublishTrack(audioPublication.track);
            }
        } catch (err) {
            console.warn('presentation unpublish audio', err);
        }
        video.pause();
        const src = video.src;
        video.removeAttribute('src');
        video.load();
        if (src) {
            URL.revokeObjectURL(src);
        }
        video.remove();
    }

    /** Host picks a local video file — it's never uploaded, only played+redrawn locally and streamed live. */
    async function startPresentation(file) {
        if (!room || stopped || !file) {
            return { ok: false };
        }
        await stopPresentationInternal();

        const video = document.createElement('video');
        video.muted = false;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.src = URL.createObjectURL(file);
        video.style.position = 'fixed';
        video.style.width = '0';
        video.style.height = '0';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        document.body.appendChild(video);

        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');

        presentation = { video, canvas, ctx, rafId: null, drawing: false, points: [], videoPublication: null, audioPublication: null };

        await new Promise((resolve) => {
            video.addEventListener(
                'loadedmetadata',
                () => {
                    if (video.videoWidth && video.videoHeight) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                    }
                    resolve();
                },
                { once: true },
            );
        });

        if (!presentation) {
            // Stopped while waiting on metadata.
            return { ok: false };
        }

        try {
            await video.play();
        } catch (err) {
            console.warn('presentation video play', err);
        }

        presentation.rafId = window.requestAnimationFrame(presentationDrawFrame);

        try {
            const canvasStream = canvas.captureStream(30);
            const videoTrack = canvasStream.getVideoTracks()[0];
            presentation.videoPublication = await room.localParticipant.publishTrack(videoTrack, {
                source: Track.Source.ScreenShare,
                name: 'presentation',
            });
        } catch (err) {
            console.warn('presentation publish video', err);
        }

        try {
            const mediaStream = video.captureStream ? video.captureStream() : video.mozCaptureStream?.();
            const audioTrack = mediaStream?.getAudioTracks?.()[0];
            if (audioTrack && presentation) {
                presentation.audioPublication = await room.localParticipant.publishTrack(audioTrack, {
                    source: Track.Source.ScreenShareAudio,
                    name: 'presentation-audio',
                });
            }
        } catch (err) {
            console.warn('presentation publish audio', err);
        }

        video.addEventListener('timeupdate', emitPresentationState);
        video.addEventListener('play', emitPresentationState);
        video.addEventListener('pause', emitPresentationState);
        video.addEventListener('ended', emitPresentationState);
        emitPresentationState();

        return { ok: true };
    }

    async function stopPresentation() {
        await stopPresentationInternal();
        emitPresentationState();
    }

    function presentationPlay() {
        presentation?.video.play().catch(() => {});
    }

    function presentationPause() {
        presentation?.video.pause();
    }

    function presentationSeek(seconds) {
        if (presentation) {
            presentation.video.currentTime = Math.max(0, seconds);
        }
    }

    function getPresentationCanvas() {
        return presentation?.canvas || null;
    }

    function setPresentationDrawing(enabled) {
        if (presentation) {
            presentation.drawing = Boolean(enabled);
        }
    }

    function presentationClearDrawing() {
        if (presentation) {
            presentation.points = [];
        }
    }

    function presentationPointerDown(x, y) {
        if (!presentation?.drawing) {
            return;
        }
        presentation.points.push([{ x, y }]);
    }

    function presentationPointerMove(x, y) {
        if (!presentation?.drawing) {
            return;
        }
        const stroke = presentation.points[presentation.points.length - 1];
        if (stroke) {
            stroke.push({ x, y });
        }
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
        getVideoElement,
        setCameraEnabled,
        setScreenShareEnabled,
        startPresentation,
        stopPresentation,
        presentationPlay,
        presentationPause,
        presentationSeek,
        getPresentationCanvas,
        setPresentationDrawing,
        presentationClearDrawing,
        presentationPointerDown,
        presentationPointerMove,
        driver: 'livekit',
    };
}
