/**
 * Native WebRTC mesh for Mad Fan Stage (no npm WebRTC deps).
 * Speakers: full mesh (lower user id initiates).
 * Listeners: recvonly offers toward each speaker.
 * Signaling: Laravel Reverb (preferred) + HTTP poll fallback of /social/stage/{id}/signals
 *
 * ICE candidates are batched to avoid bursting past stage-signal-post rate limits.
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
    onStatus,
}) {
    const peers = new Map();
    const seenSignalIds = new Set();
    const iceQueues = new Map();
    let localStream = null;
    let pollTimer = null;
    let syncTimer = null;
    let iceFlushTimer = null;
    let stopped = false;
    let currentPollMs = signalPollMs;
    const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

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

    function playRemoteAudio(audio) {
        if (!audio) {
            return;
        }
        const attempt = audio.play();
        if (attempt && typeof attempt.then === 'function') {
            attempt
                .then(() => {
                    if (!iAmOnStage) {
                        setStatus('Hearing stage…');
                    }
                })
                .catch(() => {
                    setStatus('Tap Stage controls to hear audio');
                });
        }
    }

    /** Call from a trusted user gesture so browsers unlock WebRTC remote audio. */
    function unlockPlayback() {
        document.querySelectorAll('audio[id^="stage-remote-audio-"]').forEach((audio) => {
            audio.muted = false;
            audio.volume = 1;
            playRemoteAudio(audio);
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
        removeRemoteAudio(peerUserId);
    }

    function resetAllPeers() {
        for (const id of [...peers.keys()]) {
            closePeer(id);
        }
    }

    async function createPeer(peerUserId, { initiator, recvOnly }) {
        if (peers.has(peerUserId) || stopped) {
            return peers.get(peerUserId);
        }
        const pc = new RTCPeerConnection({ iceServers });
        const entry = { pc, initiator, recvOnly };
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
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                closePeer(peerUserId);
            }
        };

        if (!recvOnly) {
            const stream = await ensureLocalStream();
            if (stream) {
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            }
        } else {
            pc.addTransceiver('audio', { direction: 'recvonly' });
        }

        if (initiator) {
            try {
                const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
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
        await entry.pc.setRemoteDescription({ type: payload.type || 'offer', sdp: payload.sdp });
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
    }

    async function handleIce(fromUserId, payload) {
        const entry = peers.get(fromUserId);
        if (!entry) return;

        const list = Array.isArray(payload?.candidates)
            ? payload.candidates
            : payload?.candidate
              ? [payload.candidate]
              : [];

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
        for (const signal of signals || []) {
            await applySignal(signal);
        }
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
        if (pollTimer) window.clearTimeout(pollTimer);
        if (syncTimer) window.clearInterval(syncTimer);
        if (iceFlushTimer) window.clearTimeout(iceFlushTimer);
        pollTimer = null;
        syncTimer = null;
        iceFlushTimer = null;
        iceQueues.clear();
        for (const id of [...peers.keys()]) closePeer(id);
        if (localStream) {
            localStream.getTracks().forEach((t) => t.stop());
            localStream = null;
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
