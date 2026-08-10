/**
 * Native WebRTC mesh for Mad Fan Stage (no npm WebRTC deps).
 * Speakers: full mesh (lower user id initiates).
 * Listeners: recvonly offers toward each speaker.
 * Signaling: Laravel Reverb (preferred) + HTTP poll fallback of /social/stage/{id}/signals
 *
 * ICE candidates are batched to avoid bursting past stage-signal-post rate limits.
 * Early ICE (before remote description) is buffered. Offers/answers/ICE are serialized.
 * On 429, signal poll backs off exponentially so the limiter can recover.
 */
export function createStageVoiceSession({
    stageId,
    myUserId,
    getParticipants,
    voiceEnabled,
    iAmOnStage,
    isMuted,
    signalPollMs = 1500,
    iceServers: iceServersOption = null,
    onStatus,
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
    /** Set by a trusted user gesture (Tap to hear) so later remote tracks can autoplay. */
    let playbackUnlocked = false;
    let unlockAudioContext = null;

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

    async function ensureLocalStream() {
        if (!iAmOnStage || !voiceEnabled) {
            return null;
        }
        if (localStream) {
            localStream.getAudioTracks().forEach((t) => {
                t.enabled = !isMuted;
            });
            return localStream;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus('Mic unavailable in this browser.');
            return null;
        }
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true },
                video: false,
            });
            localStream.getAudioTracks().forEach((t) => {
                t.enabled = !isMuted;
            });
            setStatus(isMuted ? 'Mic ready (muted)' : 'Mic live');
            return localStream;
        } catch (err) {
            setStatus('Mic permission denied');
            console.warn('Stage getUserMedia', err);
            return null;
        }
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
        audio.volume = 1;
        audio.srcObject = stream;
        playRemoteAudio(audio);
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
            source.connect(ctx.destination);
            source.start(0);
        } catch (err) {
            console.warn('stage audio unlock context', err);
        }
    }

    /**
     * Call from a trusted user gesture so browsers unlock WebRTC remote audio.
     * Safe before remote tracks exist — marks unlocked so later attachRemoteAudio can play.
     * Important: do not await before audio.play(); that would drop the gesture token.
     */
    function unlockPlayback() {
        playbackUnlocked = true;
        setStatus('Unlocking audio…');
        warmUnlockGestureSync();

        const audios = listRemoteAudios();
        if (!audios.length) {
            setStatus('Audio unlocked — waiting for speakers…');
            return Promise.resolve({ played: 0, failed: 0, pending: true });
        }

        const playPromises = audios.map((audio) => playRemoteAudio(audio));

        return Promise.all(playPromises).then((results) => {
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
        const entry = { pc, initiator, recvOnly, iceFailed: false };
        peers.set(peerUserId, entry);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                queueIce(peerUserId, event.candidate.toJSON());
            }
        };
        pc.ontrack = (event) => {
            const stream = event.streams[0] || new MediaStream([event.track]);
            attachRemoteAudio(peerUserId, stream);
        };
        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            if (state === 'connected' || state === 'completed') {
                entry.iceFailed = false;
                if (!iAmOnStage) {
                    // Do not claim "Hearing" until <audio>.play() succeeds (autoplay may still block).
                    if (!playbackUnlocked) {
                        setStatus('Connected — tap Tap to hear');
                    }
                } else if (isMuted) {
                    setStatus('Mic muted');
                } else {
                    setStatus('Mic live');
                }
            } else if (state === 'failed') {
                entry.iceFailed = true;
                setStatus('Voice blocked by network — try same Wi‑Fi or configure TURN');
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

        // Role changed (listener ↔ speaker): rebuild so tracks/directions match.
        if (entry && entry.recvOnly !== recvOnly) {
            closePeer(fromUserId);
            entry = null;
        }

        if (!entry) {
            entry = await createPeer(fromUserId, { initiator: false, recvOnly });
        }

        await ensureAudioSenders(entry);
        await entry.pc.setRemoteDescription({ type: payload.type || 'offer', sdp: payload.sdp });
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
        await entry.pc.setRemoteDescription({ type: payload.type || 'answer', sdp: payload.sdp });
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
        signalChain = signalChain
            .then(async () => {
                for (const signal of signals || []) {
                    await applySignal(signal);
                }
            })
            .catch((err) => console.warn('signal ingest', err));
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
        try {
            const res = await fetch(`/social/stage/${stageId}/signals`, {
                credentials: 'same-origin',
                headers: csrfHeaders(),
            });
            if (res.status === 429) {
                currentPollMs = Math.min(Math.max(currentPollMs, signalPollMs) * 2, 30000);
                setStatus('Signaling slowed (rate limit)…');
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
        if (!stopped && voiceEnabled) {
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

    function start() {
        if (stopped) return;
        if (!voiceEnabled) {
            setStatus('Waiting for host to start voice');
            return;
        }
        setStatus(iAmOnStage ? 'Connecting stage…' : 'Connecting as listener…');
        currentPollMs = signalPollMs;
        syncPeers();
        schedulePoll(0);
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

        // Promote/demote must renegotiate send/recv — stale recvonly peers cannot transmit.
        if (prevOnStage !== iAmOnStage && voiceEnabled) {
            resetAllPeers();
            syncPeers();
        }

        if (voiceEnabled && !pollTimer && !stopped) start();
        if (!voiceEnabled && pollTimer) {
            resetAllPeers();
            if (localStream) {
                localStream.getTracks().forEach((t) => t.stop());
                localStream = null;
            }
            window.clearTimeout(pollTimer);
            window.clearInterval(syncTimer);
            if (iceFlushTimer) window.clearTimeout(iceFlushTimer);
            pollTimer = null;
            syncTimer = null;
            iceFlushTimer = null;
            setStatus('Voice off');
        }
    }

    return { start, stop, update, applyMute, ingestSignals, unlockPlayback };
}
