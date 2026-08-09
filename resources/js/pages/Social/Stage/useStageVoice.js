/**
 * Native WebRTC mesh for Mad Fan Stage (no npm WebRTC deps).
 * Speakers: full mesh (lower user id initiates).
 * Listeners: recvonly offers toward each speaker.
 * Signaling: Laravel Reverb (preferred) + HTTP poll fallback of /social/stage/{id}/signals
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
    let localStream = null;
    let pollTimer = null;
    let syncTimer = null;
    let stopped = false;
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
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Signal failed (${res.status}): ${text.slice(0, 120)}`);
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
            setStatus('Mic live');
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
            document.body.appendChild(audio);
        }
        audio.srcObject = stream;
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
        removeRemoteAudio(peerUserId);
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
                postSignal(peerUserId, 'ice', { candidate: event.candidate.toJSON() }).catch((e) =>
                    console.warn('ICE signal', e),
                );
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
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
            await pc.setLocalDescription(offer);
            await postSignal(peerUserId, 'offer', {
                sdp: pc.localDescription.sdp,
                type: pc.localDescription.type,
            });
        }
        return entry;
    }

    async function handleOffer(fromUserId, payload) {
        const participants = getParticipants() || [];
        const remote = participants.find((p) => p.user_id === fromUserId);
        const recvOnly = !iAmOnStage && Boolean(remote?.on_stage);
        let entry = peers.get(fromUserId);
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
        if (!entry || !payload?.candidate) return;
        try {
            await entry.pc.addIceCandidate(payload.candidate);
        } catch (err) {
            console.warn('addIceCandidate', err);
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

    async function pollSignals() {
        if (stopped || !voiceEnabled) return;
        try {
            const res = await fetch(`/social/stage/${stageId}/signals`, {
                credentials: 'same-origin',
                headers: csrfHeaders(),
            });
            if (!res.ok) return;
            const data = await res.json();
            await ingestSignals(data.signals || []);
        } catch (err) {
            console.warn('signal poll', err);
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
        }
    }

    function start() {
        if (stopped) return;
        if (!voiceEnabled) {
            setStatus('Waiting for host to start voice');
            return;
        }
        setStatus(iAmOnStage ? 'Connecting stage…' : 'Connecting as listener…');
        syncPeers();
        pollTimer = window.setInterval(pollSignals, signalPollMs);
        syncTimer = window.setInterval(syncPeers, Math.max(signalPollMs * 2, 3000));
        pollSignals();
    }

    function stop() {
        stopped = true;
        if (pollTimer) window.clearInterval(pollTimer);
        if (syncTimer) window.clearInterval(syncTimer);
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
        if (typeof next.iAmOnStage === 'boolean') iAmOnStage = next.iAmOnStage;
        if (typeof next.isMuted === 'boolean') {
            isMuted = next.isMuted;
            applyMute();
        }
        if (voiceEnabled && !pollTimer && !stopped) start();
        if (!voiceEnabled && pollTimer) {
            for (const id of [...peers.keys()]) closePeer(id);
            if (localStream) {
                localStream.getTracks().forEach((t) => t.stop());
                localStream = null;
            }
            window.clearInterval(pollTimer);
            window.clearInterval(syncTimer);
            pollTimer = null;
            syncTimer = null;
            setStatus('Voice off');
        }
    }

    return { start, stop, update, applyMute, ingestSignals };
}
