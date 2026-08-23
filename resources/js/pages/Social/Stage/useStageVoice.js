/**
 * Native WebRTC mesh for Mad Fan Stage (fallback when LiveKit is off).
 * Speakers: full mesh (lower user id initiates).
 * Listeners: recvonly offers toward each speaker.
 * Signaling: Laravel Reverb (primary when healthy) + HTTP /signals only if WS is down.
 *
 * ICE candidates are batched to avoid bursting past stage-signal-post rate limits.
 * Early ICE (before remote description) is buffered. Offers/answers/ICE are serialized.
 * On 429, signal poll backs off exponentially so the limiter can recover.
 */
import { createStageLiveKitVoiceSession } from './useStageLiveKitVoice';
import {
    describeMicError,
    mediaDevicesAvailable,
    requestStageMicrophone,
} from './stageMicPermission';
import {
    canApplyRemoteAnswer,
    canApplyRemoteOffer,
    normalizeRemoteDescription,
} from './stageSdp';
import { effectiveVolume, subscribeAudioOutput } from './stageAudioOutput';

// Active-speaker detection tuning: RMS above threshold marks "speaking", held for the
// hangover window so a tile ring doesn't flicker between syllables.
const SPEAKING_THRESHOLD = 0.04;
const SPEAKING_HANGOVER_MS = 450;

export function createStageMeshVoiceSession({
    stageId,
    myUserId,
    getParticipants,
    voiceEnabled,
    iAmOnStage,
    isMuted,
    signalPollMs = 1500,
    iceServers: iceServersOption = null,
    /** When false, skip HTTP signal poll (Reverb delivers .signal.created). */
    allowHttpSignals = true,
    onStatus,
    onActiveSpeakers,
}) {
    const peers = new Map();
    const seenSignalIds = new Set();
    const iceQueues = new Map();
    const pendingRemoteIce = new Map();
    let localStream = null;
    let pollTimer = null;
    let syncTimer = null;
    let iceFlushTimer = null;
    let stopped = false;
    let currentPollMs = signalPollMs;
    let signalChain = Promise.resolve();
    let iceServers = normalizeIceServers(iceServersOption);
    /** Set when playback succeeds or the user interacts with the page. */
    let playbackUnlocked = false;
    let unlockAudioContext = null;
    /** After a hard mic deny, pause auto getUserMedia until Enable microphone. */
    let micBlocked = false;
    /** Active-speaker detection: one AnalyserNode per stream + a single rAF loop. */
    const analyserNodes = new Map();
    let localAnalyser = null;
    let speakerRafHandle = null;
    let lastSpeakingKey = '';
    let unsubscribeAudioOutput = null;

    function normalizeIceServers(servers) {
        if (Array.isArray(servers) && servers.length > 0) {
            return servers;
        }
        return [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ];
    }

    function setStatus(msg) {
        if (typeof onStatus === 'function') {
            onStatus(msg);
        }
    }

    function csrfHeaders() {
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
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

    async function postSignal(toUserId, type, payload) {
        const res = await fetch(`/social/stage/${stageId}/signals`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: csrfHeaders(),
            body: JSON.stringify({ to_user_id: toUserId, type, payload }),
        });
        if (res.status === 429) {
            const err = new Error('Signal rate limited (429)');
            err.status = 429;
            throw err;
        }
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Signal failed (${res.status}): ${text.slice(0, 120)}`);
        }
    }

    function queueIce(peerUserId, candidate) {
        if (!candidate) {
            return;
        }
        const bucket = iceQueues.get(peerUserId) || [];
        bucket.push(candidate);
        iceQueues.set(peerUserId, bucket);
        if (!iceFlushTimer) {
            iceFlushTimer = window.setTimeout(flushIceQueues, 120);
        }
    }

    async function flushIceQueues() {
        iceFlushTimer = null;
        if (stopped) {
            iceQueues.clear();
            return;
        }
        const entries = [...iceQueues.entries()];
        iceQueues.clear();
        for (const [peerUserId, candidates] of entries) {
            if (!candidates.length || !peers.has(peerUserId)) {
                continue;
            }
            try {
                if (candidates.length === 1) {
                    await postSignal(peerUserId, 'ice', { candidate: candidates[0] });
                } else {
                    await postSignal(peerUserId, 'ice', { candidates });
                }
            } catch (e) {
                console.warn('ICE signal', e);
                if (e?.status === 429) {
                    const existing = iceQueues.get(peerUserId) || [];
                    iceQueues.set(peerUserId, [...candidates, ...existing]);
                    if (!iceFlushTimer) {
                        iceFlushTimer = window.setTimeout(flushIceQueues, 1500);
                    }
                }
            }
        }
    }

    async function ensureLocalStream({ force = false } = {}) {
        if (!iAmOnStage || !voiceEnabled) {
            return null;
        }
        if (localStream) {
            localStream.getAudioTracks().forEach((t) => {
                t.enabled = !isMuted;
            });
            return localStream;
        }
        if (micBlocked && !force) {
            setStatus(describeMicError({ name: 'NotAllowedError' }).status);
            return null;
        }
        if (!mediaDevicesAvailable()) {
            setStatus(describeMicError({ name: 'NotSupportedError' }).status);
            return null;
        }
        const result = await requestStageMicrophone({ keepStream: true });
        if (!result.ok) {
            console.warn('Stage getUserMedia', result.cause);
            if (result.error.code === 'blocked') {
                micBlocked = true;
            }
            setStatus(result.error.status);
            return null;
        }
        localStream = result.stream;
        micBlocked = false;
        trackLocalAnalyser();
        localStream.getAudioTracks().forEach((t) => {
            t.enabled = !isMuted;
        });
        setStatus(isMuted ? 'Mic ready (muted)' : 'Mic live');
        return localStream;
    }

    async function ensureAudioSenders(entry) {
        if (!entry || entry.recvOnly || !iAmOnStage || !voiceEnabled) {
            return;
        }
        const stream = await ensureLocalStream();
        if (!stream) {
            return;
        }
        const hasAudioSender = entry.pc.getSenders().some((sender) => sender.track?.kind === 'audio');
        if (!hasAudioSender) {
            stream.getTracks().forEach((track) => entry.pc.addTrack(track, stream));
        }
    }

    function attachRemoteAudio(peerUserId, stream) {
        const elId = `stage-remote-audio-${peerUserId}`;
        let audio = document.getElementById(elId);
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = elId;
            audio.autoplay = true;
            audio.playsInline = true;
            audio.setAttribute('playsinline', '');
            audio.setAttribute('autoplay', '');
            // Keep in the document so autoplay policies treat it like page media.
            audio.style.position = 'fixed';
            audio.style.width = '0';
            audio.style.height = '0';
            audio.style.opacity = '0';
            audio.style.pointerEvents = 'none';
            document.body.appendChild(audio);
        }
        audio.muted = false;
        audio.volume = effectiveVolume();
        const sameStream = audio.srcObject === stream;
        if (!sameStream) {
            audio.srcObject = stream;
        }
        trackRemoteAnalyser(peerUserId, stream);
        if (sameStream && !audio.paused) {
            return;
        }
        playRemoteAudio(audio);
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

    // --- Active-speaker detection -------------------------------------------------
    // Each stream feeds an AnalyserNode (never connected to destination, so this does
    // not double-play audio). A single rAF loop computes RMS and emits the set of
    // user ids currently talking. Output volume/deafen does not affect detection.

    function makeAnalyserNode(stream) {
        const ctx = ensureUnlockAudioContext();
        if (!ctx || !stream) {
            return null;
        }
        try {
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.6;
            source.connect(analyser);
            return { source, analyser, data: new Uint8Array(analyser.fftSize), lastLoud: 0, streamId: stream.id ?? null };
        } catch (err) {
            console.warn('stage analyser', err);
            return null;
        }
    }

    function trackRemoteAnalyser(peerUserId, stream) {
        const existing = analyserNodes.get(peerUserId);
        if (existing) {
            if (existing.streamId === (stream?.id ?? null)) {
                return;
            }
            try {
                existing.source.disconnect();
            } catch {
                // ignore
            }
            analyserNodes.delete(peerUserId);
        }
        const node = makeAnalyserNode(stream);
        if (node) {
            analyserNodes.set(peerUserId, node);
            ensureSpeakerLoop();
        }
    }

    function untrackAnalyser(peerUserId) {
        const node = analyserNodes.get(peerUserId);
        if (node) {
            try {
                node.source.disconnect();
            } catch {
                // ignore
            }
            analyserNodes.delete(peerUserId);
        }
    }

    function trackLocalAnalyser() {
        if (!localStream) {
            return;
        }
        if (localAnalyser?.streamId === localStream.id) {
            return;
        }
        teardownLocalAnalyser();
        localAnalyser = makeAnalyserNode(localStream);
        if (localAnalyser) {
            ensureSpeakerLoop();
        }
    }

    function teardownLocalAnalyser() {
        if (localAnalyser) {
            try {
                localAnalyser.source.disconnect();
            } catch {
                // ignore
            }
            localAnalyser = null;
        }
    }

    function computeRms(node) {
        if (!node?.analyser) {
            return 0;
        }
        node.analyser.getByteTimeDomainData(node.data);
        let sum = 0;
        const { data } = node;
        for (let i = 0; i < data.length; i += 1) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
        }
        return Math.sqrt(sum / data.length);
    }

    function ensureSpeakerLoop() {
        if (speakerRafHandle != null || stopped) {
            return;
        }
        speakerRafHandle = window.requestAnimationFrame(speakerTick);
    }

    function speakerTick() {
        speakerRafHandle = null;
        if (stopped) {
            return;
        }
        const now = window.performance?.now?.() ?? Date.now();
        const speaking = [];

        if (localAnalyser && iAmOnStage && !isMuted) {
            if (computeRms(localAnalyser) >= SPEAKING_THRESHOLD) {
                localAnalyser.lastLoud = now;
            }
            if (now - localAnalyser.lastLoud < SPEAKING_HANGOVER_MS) {
                speaking.push(Number(myUserId));
            }
        }
        for (const [peerId, node] of analyserNodes) {
            if (computeRms(node) >= SPEAKING_THRESHOLD) {
                node.lastLoud = now;
            }
            if (now - node.lastLoud < SPEAKING_HANGOVER_MS) {
                speaking.push(Number(peerId));
            }
        }

        const key = speaking.slice().sort((a, b) => a - b).join(',');
        if (key !== lastSpeakingKey) {
            lastSpeakingKey = key;
            if (typeof onActiveSpeakers === 'function') {
                onActiveSpeakers(speaking);
            }
        }

        if (!stopped && (analyserNodes.size > 0 || localAnalyser)) {
            speakerRafHandle = window.requestAnimationFrame(speakerTick);
        }
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
                        setStatus('Hearing stage...');
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

    /**
     * Warm WebKit / Chrome autoplay gate inside a trusted user gesture.
     * Must stay synchronous (no await) so later audio.play() stays in-gesture.
     */
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
            console.warn('stage audio unlock context', err);
        }
    }

    /**
     * Unlock playback — call on join (user gesture) or page interaction retry.
     * Safe before remote tracks exist; later attachRemoteAudio will play automatically.
     */
    function unlockPlayback() {
        playbackUnlocked = true;
        warmUnlockGestureSync();

        const audios = listRemoteAudios();
        if (!audios.length) {
            if (!iAmOnStage) {
                setStatus('Connecting as listener...');
            }
            return Promise.resolve({ played: 0, failed: 0, pending: true });
        }

        const playPromises = audios.map((audio) => playRemoteAudio(audio));

        return Promise.all(playPromises).then((results) => {
            const played = results.filter(Boolean).length;
            const failed = results.length - played;

            if (played > 0) {
                setStatus(iAmOnStage ? 'Hearing peers...' : 'Hearing stage...');
            } else if (failed > 0) {
                setStatus('Audio paused — tap anywhere to hear');
            } else if (!iAmOnStage) {
                setStatus('Connecting as listener...');
            }

            return { played, failed, pending: false };
        });
    }

    function removeRemoteAudio(peerUserId) {
        const audio = document.getElementById(`stage-remote-audio-${peerUserId}`);
        if (audio) {
            audio.srcObject = null;
            audio.remove();
        }
    }

    function closePeer(peerUserId) {
        const entry = peers.get(peerUserId);
        if (entry) {
            entry.pc.close();
            peers.delete(peerUserId);
        }
        iceQueues.delete(peerUserId);
        pendingRemoteIce.delete(peerUserId);
        removeRemoteAudio(peerUserId);
        untrackAnalyser(peerUserId);
    }

    function resetAllPeers() {
        for (const id of [...peers.keys()]) {
            closePeer(id);
        }
    }

    function bufferRemoteIce(peerUserId, candidates) {
        const bucket = pendingRemoteIce.get(peerUserId) || [];
        for (const candidate of candidates) {
            if (candidate) {
                bucket.push(candidate);
            }
        }
        pendingRemoteIce.set(peerUserId, bucket);
    }

    async function flushPendingRemoteIce(peerUserId) {
        const entry = peers.get(peerUserId);
        const bucket = pendingRemoteIce.get(peerUserId) || [];
        pendingRemoteIce.delete(peerUserId);
        if (!entry?.pc?.remoteDescription || !bucket.length) {
            if (bucket.length) {
                pendingRemoteIce.set(peerUserId, bucket);
            }
            return;
        }
        for (const candidate of bucket) {
            try {
                await entry.pc.addIceCandidate(candidate);
            } catch (err) {
                console.warn('addIceCandidate', err);
            }
        }
    }

    async function createPeer(peerUserId, { initiator, recvOnly }) {
        if (peers.has(peerUserId) || stopped) {
            return peers.get(peerUserId);
        }
        const pc = new RTCPeerConnection({ iceServers });
        const entry = { pc, initiator, recvOnly, iceFailed: false, attachedTrackIds: new Set() };
        peers.set(peerUserId, entry);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                queueIce(peerUserId, event.candidate.toJSON());
            }
        };
        pc.ontrack = (event) => {
            const trackId = event.track?.id;
            if (trackId && entry.attachedTrackIds.has(trackId)) {
                return;
            }
            if (trackId) {
                entry.attachedTrackIds.add(trackId);
            }
            const stream = event.streams[0] || new MediaStream([event.track]);
            attachRemoteAudio(peerUserId, stream);
        };
        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            if (state === 'connected' || state === 'completed') {
                entry.iceFailed = false;
                if (!iAmOnStage) {
                    listRemoteAudios().forEach((audio) => playRemoteAudio(audio));
                } else if (isMuted) {
                    setStatus('Mic muted');
                } else {
                    setStatus('Mic live');
                }
            } else if (state === 'failed') {
                entry.iceFailed = true;
                setStatus('Voice blocked by network - try same Wi-Fi or configure TURN');
                closePeer(peerUserId);
            }
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                closePeer(peerUserId);
            }
        };

        if (!recvOnly) {
            await ensureAudioSenders(entry);
        } else {
            pc.addTransceiver('audio', { direction: 'recvonly' });
        }

        if (initiator) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await postSignal(peerUserId, 'offer', {
                    sdp: pc.localDescription.sdp,
                    type: pc.localDescription.type,
                });
            } catch (e) {
                closePeer(peerUserId);
                throw e;
            }
        }
        return entry;
    }

    async function handleOffer(fromUserId, payload) {
        const participants = getParticipants() || [];
        const remote = participants.find((p) => p.user_id === fromUserId);
        const recvOnly = !iAmOnStage && Boolean(remote?.on_stage);
        let entry = peers.get(fromUserId);

        // Role changed (listener ? speaker): rebuild so tracks/directions match.
        if (entry && entry.recvOnly !== recvOnly) {
            closePeer(fromUserId);
            entry = null;
        }

        if (!entry) {
            entry = await createPeer(fromUserId, { initiator: false, recvOnly });
        }

        await ensureAudioSenders(entry);
        const offerState = entry.pc.signalingState;
        if (!canApplyRemoteOffer(offerState, { initiator: entry.initiator })) {
            if (offerState !== 'stable') {
                console.warn('signal ingest skipped offer: wrong signalingState', fromUserId, offerState);
            }
            return;
        }
        const remoteDescription = normalizeRemoteDescription({
            type: payload.type || 'offer',
            sdp: payload.sdp,
        });
        if (!remoteDescription) {
            console.warn('signal ingest skipped offer: invalid SDP', fromUserId);
            return;
        }
        if (
            entry.pc.signalingState === 'stable' &&
            entry.pc.remoteDescription?.sdp === remoteDescription.sdp
        ) {
            return;
        }
        try {
            await entry.pc.setRemoteDescription(remoteDescription);
        } catch (err) {
            console.warn('signal ingest setRemoteDescription(offer)', err);
            return;
        }
        await flushPendingRemoteIce(fromUserId);
        const answer = await entry.pc.createAnswer();
        await entry.pc.setLocalDescription(answer);
        await postSignal(fromUserId, 'answer', {
            sdp: entry.pc.localDescription.sdp,
            type: entry.pc.localDescription.type,
        });
    }

    async function handleAnswer(fromUserId, payload) {
        const entry = peers.get(fromUserId);
        if (!entry) return;
        const answerState = entry.pc.signalingState;
        if (!canApplyRemoteAnswer(answerState)) {
            // stable = duplicate/stale answer after peer reset or dual delivery — ignore quietly.
            if (answerState !== 'stable') {
                console.warn('signal ingest skipped answer: wrong signalingState', fromUserId, answerState);
            }
            return;
        }
        const remoteDescription = normalizeRemoteDescription({
            type: payload.type || 'answer',
            sdp: payload.sdp,
        });
        if (!remoteDescription) {
            console.warn('signal ingest skipped answer: invalid SDP', fromUserId);
            return;
        }
        try {
            await entry.pc.setRemoteDescription(remoteDescription);
        } catch (err) {
            console.warn('signal ingest setRemoteDescription(answer)', err);
            return;
        }
        await flushPendingRemoteIce(fromUserId);
    }

    async function handleIce(fromUserId, payload) {
        const list = Array.isArray(payload?.candidates)
            ? payload.candidates
            : payload?.candidate
              ? [payload.candidate]
              : [];

        const entry = peers.get(fromUserId);
        if (!entry?.pc?.remoteDescription) {
            bufferRemoteIce(fromUserId, list);
            return;
        }

        for (const candidate of list) {
            if (!candidate) continue;
            try {
                await entry.pc.addIceCandidate(candidate);
            } catch (err) {
                console.warn('addIceCandidate', err);
            }
        }
    }

    async function applySignal(signal) {
        if (!signal?.id || seenSignalIds.has(signal.id)) {
            return;
        }
        seenSignalIds.add(signal.id);

        const from = signal.from_user_id;
        const payload = signal.payload || {};
        if (signal.type === 'offer') await handleOffer(from, payload);
        else if (signal.type === 'answer') await handleAnswer(from, payload);
        else if (signal.type === 'ice') await handleIce(from, payload);
    }

    async function ingestSignals(signals) {
        signalChain = signalChain.then(async () => {
            for (const signal of signals || []) {
                try {
                    await applySignal(signal);
                } catch (err) {
                    console.warn('signal ingest', err);
                }
            }
        });
        await signalChain;
    }

    function schedulePoll(delayMs = currentPollMs) {
        if (pollTimer) {
            window.clearTimeout(pollTimer);
        }
        pollTimer = window.setTimeout(() => {
            pollSignals();
        }, delayMs);
    }

    async function pollSignals() {
        if (stopped || !voiceEnabled) return;
        if (!allowHttpSignals) {
            // Reverb is healthy - do not hammer /signals; keep timer dormant until fallback flips on.
            return;
        }
        try {
            const res = await fetch(`/social/stage/${stageId}/signals`, {
                credentials: 'same-origin',
                headers: csrfHeaders(),
            });
            if (res.status === 429) {
                currentPollMs = Math.min(Math.max(currentPollMs, signalPollMs) * 2, 30000);
                setStatus('Signaling slowed (rate limit)...');
                schedulePoll(currentPollMs);
                return;
            }
            if (!res.ok) {
                schedulePoll(Math.min(currentPollMs * 1.5, 15000));
                return;
            }
            currentPollMs = signalPollMs;
            const data = await res.json();
            await ingestSignals(data.signals || []);
        } catch (err) {
            console.warn('signal poll', err);
        }
        if (!stopped && voiceEnabled && allowHttpSignals) {
            schedulePoll(currentPollMs);
        }
    }

    async function syncPeers() {
        if (stopped || !voiceEnabled) return;
        const participants = getParticipants() || [];
        const speakers = participants.filter((p) => p.on_stage);
        if (iAmOnStage) {
            await ensureLocalStream();
            for (const speaker of speakers) {
                if (speaker.user_id === myUserId) continue;
                const existing = peers.get(speaker.user_id);
                if (existing?.recvOnly) {
                    closePeer(speaker.user_id);
                }
                if (!peers.has(speaker.user_id)) {
                    await createPeer(speaker.user_id, {
                        initiator: myUserId < speaker.user_id,
                        recvOnly: false,
                    }).catch((e) => console.warn('peer', e));
                } else {
                    await ensureAudioSenders(peers.get(speaker.user_id));
                }
            }
        } else {
            for (const speaker of speakers) {
                if (speaker.user_id === myUserId) continue;
                const existing = peers.get(speaker.user_id);
                if (existing && !existing.recvOnly) {
                    closePeer(speaker.user_id);
                }
                if (!peers.has(speaker.user_id)) {
                    await createPeer(speaker.user_id, { initiator: true, recvOnly: true }).catch((e) =>
                        console.warn('listener peer', e),
                    );
                }
            }
        }
        for (const peerId of [...peers.keys()]) {
            if (!speakers.some((s) => s.user_id === peerId)) {
                closePeer(peerId);
            }
        }
    }

    function applyMute() {
        if (localStream) {
            localStream.getAudioTracks().forEach((t) => {
                t.enabled = !isMuted;
            });
            if (iAmOnStage && voiceEnabled) {
                setStatus(isMuted ? 'Mic muted' : 'Mic live');
            }
        }
    }

    /**
     * Call from a trusted click so the browser may show the permission prompt.
     */
    async function retryMicAccess() {
        if (stopped || !voiceEnabled || !iAmOnStage) {
            return { ok: false };
        }
        setStatus('Requesting microphone...');
        micBlocked = false;
        if (localStream) {
            localStream.getTracks().forEach((t) => t.stop());
            localStream = null;
        }
        const stream = await ensureLocalStream({ force: true });
        if (!stream) {
            return { ok: false };
        }
        resetAllPeers();
        await syncPeers();
        return { ok: true };
    }

    function start() {
        if (stopped) return;
        if (!unsubscribeAudioOutput) {
            unsubscribeAudioOutput = subscribeAudioOutput(() => applyOutputVolume());
        }
        if (!voiceEnabled) {
            setStatus('Waiting for host to start voice');
            return;
        }
        setStatus(iAmOnStage ? 'Connecting stage...' : 'Connecting as listener...');
        currentPollMs = signalPollMs;
        syncPeers();
        if (allowHttpSignals) {
            schedulePoll(0);
        }
        syncTimer = window.setInterval(syncPeers, Math.max(signalPollMs * 2, 3000));
    }

    function stop() {
        stopped = true;
        playbackUnlocked = false;
        if (pollTimer) window.clearTimeout(pollTimer);
        if (syncTimer) window.clearInterval(syncTimer);
        if (iceFlushTimer) window.clearTimeout(iceFlushTimer);
        pollTimer = null;
        syncTimer = null;
        iceFlushTimer = null;
        iceQueues.clear();
        pendingRemoteIce.clear();
        for (const id of [...peers.keys()]) closePeer(id);
        if (localStream) {
            localStream.getTracks().forEach((t) => t.stop());
            localStream = null;
        }
        if (speakerRafHandle != null) {
            window.cancelAnimationFrame(speakerRafHandle);
            speakerRafHandle = null;
        }
        teardownLocalAnalyser();
        analyserNodes.forEach((node) => {
            try {
                node.source.disconnect();
            } catch {
                // ignore
            }
        });
        analyserNodes.clear();
        lastSpeakingKey = '';
        if (typeof onActiveSpeakers === 'function') {
            onActiveSpeakers([]);
        }
        if (unsubscribeAudioOutput) {
            unsubscribeAudioOutput();
            unsubscribeAudioOutput = null;
        }
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
        if (typeof next.getParticipants === 'function') getParticipants = next.getParticipants;
        if (typeof next.voiceEnabled === 'boolean') voiceEnabled = next.voiceEnabled;

        const prevOnStage = iAmOnStage;
        if (typeof next.iAmOnStage === 'boolean') iAmOnStage = next.iAmOnStage;

        if (typeof next.isMuted === 'boolean') {
            isMuted = next.isMuted;
            applyMute();
        }

        if (typeof next.signalPollMs === 'number' && next.signalPollMs > 0) {
            signalPollMs = next.signalPollMs;
            if (currentPollMs < signalPollMs || currentPollMs === signalPollMs) {
                currentPollMs = signalPollMs;
            }
        }

        if (Array.isArray(next.iceServers) && next.iceServers.length > 0) {
            iceServers = normalizeIceServers(next.iceServers);
        }

        if (typeof next.allowHttpSignals === 'boolean') {
            const wasAllowed = allowHttpSignals;
            allowHttpSignals = next.allowHttpSignals;
            if (allowHttpSignals && !wasAllowed && voiceEnabled && !stopped) {
                schedulePoll(0);
            }
            if (!allowHttpSignals && pollTimer) {
                window.clearTimeout(pollTimer);
                pollTimer = null;
            }
        }

        // Promote/demote must renegotiate send/recv - stale recvonly peers cannot transmit.
        if (prevOnStage !== iAmOnStage && voiceEnabled) {
            resetAllPeers();
            syncPeers();
        }

        if (voiceEnabled && !syncTimer && !stopped) start();
        if (!voiceEnabled && syncTimer) {
            resetAllPeers();
            if (localStream) {
                localStream.getTracks().forEach((t) => t.stop());
                localStream = null;
            }
            teardownLocalAnalyser();
            window.clearTimeout(pollTimer);
            window.clearInterval(syncTimer);
            if (iceFlushTimer) window.clearTimeout(iceFlushTimer);
            pollTimer = null;
            syncTimer = null;
            iceFlushTimer = null;
            setStatus('Voice off');
        }
    }

    return {
        start,
        stop,
        update,
        applyMute,
        ingestSignals,
        unlockPlayback,
        retryMicAccess,
        driver: 'mesh',
    };
}

/**
 * Stage voice entry: LiveKit SFU when driver === 'livekit', else mesh WebRTC.
 */
export function createStageVoiceSession(options = {}) {
    if (options.driver === 'livekit') {
        return createStageLiveKitVoiceSession(options);
    }

    return createStageMeshVoiceSession(options);
}

