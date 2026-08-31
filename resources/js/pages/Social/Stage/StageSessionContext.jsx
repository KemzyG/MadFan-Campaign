import { router } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { getEcho, leaveEchoChannel, subscribeEchoConnection } from '../../../echo';
import { requestStageMicrophone } from './stageMicPermission';
import {
    getAudioOutput,
    setVolume as setOutputVolume,
    subscribeAudioOutput,
} from './stageAudioOutput';
import { createStageVoiceSession } from './useStageVoice';
import { reduceVoiceConnection } from './stageVoiceConnection';

const StageSessionContext = createContext(null);

// How long a floating reaction emoji lives before it's removed from the layer.
const REACTION_TTL_MS = 4200;

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

/** True when `path` is the room route for `stageId` (works in `/social` and subdomain modes). */
function isStageRoomPath(path, stageId) {
    if (!stageId) {
        return false;
    }
    return String(path).split('?')[0].endsWith(`/stage/${stageId}`);
}

function roomFromPageProps(props) {
    if (!props?.stage?.id) {
        return null;
    }

    return {
        stage: props.stage,
        participants: props.participants || [],
        messages: props.messages || [],
        pinned_message: props.pinned_message ?? null,
        reactions: props.reactions || [],
        reaction_options: props.reaction_options || [],
        me: props.me ?? null,
        voice: props.voice ?? null,
        realtime: props.realtime ?? null,
        max_message_length: props.max_message_length ?? 280,
        poll_ms: props.poll_ms ?? 3000,
    };
}

export function StageSessionProvider({ children }) {
    const [activeStageId, setActiveStageId] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatUnread, setChatUnread] = useState(0);
    const [room, setRoom] = useState(null);
    const [voiceStatus, setVoiceStatus] = useState('Idle');
    const [loading, setLoading] = useState(false);
    const [reactions, setReactions] = useState([]);
    const [activeSpeakers, setActiveSpeakers] = useState(() => new Set());
    const [peerStates, setPeerStates] = useState(() => new Map());
    /** Live `<video>` elements for camera/screen-share tracks, keyed `${userId}:${source}`
     *  — LiveKit-only (see useStageLiveKitVoice); the mesh driver never calls onVideoTrack. */
    const [videoTracks, setVideoTracks] = useState(() => new Map());
    /** { playing, currentTime, duration, drawing } while I'm presenting, else null. LiveKit-only. */
    const [presentationState, setPresentationState] = useState(null);
    const [audioOutputState, setAudioOutputState] = useState(getAudioOutput);
    const [currentPath, setCurrentPath] = useState(() =>
        typeof window !== 'undefined' ? window.location.pathname : '',
    );

    const roomRef = useRef(null);
    const voiceRef = useRef(null);
    const pollTimerRef = useRef(null);
    const activeStageIdRef = useRef(null);
    const heartbeatTimerRef = useRef(null);
    const chatOpenRef = useRef(false);
    const seenMessageCountRef = useRef(0);
    const roomPollBackoffRef = useRef(null);
    const pendingUnlockRef = useRef(false);
    const unlockVoicePlaybackRef = useRef(() => {});
    const echoConnectedRef = useRef(false);
    const reactionSeqRef = useRef(0);
    const reactionTimersRef = useRef(new Map());
    const seenReactionIdsRef = useRef(new Set());
    const [echoConnected, setEchoConnected] = useState(false);

    useEffect(() => {
        roomRef.current = room;
    }, [room]);

    useEffect(() => {
        activeStageIdRef.current = activeStageId;
    }, [activeStageId]);

    useEffect(() => {
        chatOpenRef.current = chatOpen;
    }, [chatOpen]);

    useEffect(() => {
        echoConnectedRef.current = echoConnected;
    }, [echoConnected]);

    // Mirror the persisted audio-output store into React state for the audio menu UI.
    useEffect(() => subscribeAudioOutput(setAudioOutputState), []);

    useEffect(() => {
        const shell = document.querySelector('.mf-stage');
        if (!shell) {
            return undefined;
        }

        const url = room?.stage?.background_url;
        if (url) {
            shell.style.setProperty('--mf-stage-bg-image', `url('${url}')`);
        } else {
            shell.style.removeProperty('--mf-stage-bg-image');
        }

        return () => {
            shell.style.removeProperty('--mf-stage-bg-image');
        };
    }, [room?.stage?.background_url]);

    // Track Reverb socket health so HTTP room/signal poll only runs when WS is down.
    useEffect(() => {
        if (room?.realtime?.mode !== 'reverb') {
            setEchoConnected(false);
            return undefined;
        }
        return subscribeEchoConnection(setEchoConnected);
    }, [room?.realtime?.mode]);

    // Float a single emoji over the deck and schedule its removal.
    const animateEmoji = useCallback((emoji) => {
        if (!emoji) {
            return;
        }
        reactionSeqRef.current += 1;
        const key = `rx-${reactionSeqRef.current}`;
        setReactions((prev) => {
            const trimmed = prev.length >= 40 ? prev.slice(prev.length - 39) : prev;
            return [...trimmed, { key, emoji }];
        });
        const timer = window.setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.key !== key));
            reactionTimersRef.current.delete(key);
        }, REACTION_TTL_MS);
        reactionTimersRef.current.set(key, timer);
    }, []);

    // Merge server reaction rows (poll + Echo). Each id animates at most once; my own
    // reactions are skipped here because the control bar already animated them locally.
    // On a fresh join the existing window is seeded (marked seen) so history doesn't burst.
    const ingestReactions = useCallback(
        (list, myId, { seed = false } = {}) => {
            if (!Array.isArray(list) || list.length === 0) {
                return;
            }
            for (const reaction of list) {
                const id = reaction?.id;
                if (id == null || seenReactionIdsRef.current.has(id)) {
                    continue;
                }
                seenReactionIdsRef.current.add(id);
                if (seed) {
                    continue;
                }
                if (myId != null && Number(reaction.user_id) === Number(myId)) {
                    continue;
                }
                animateEmoji(reaction.emoji);
            }
        },
        [animateEmoji],
    );

    const clearReactions = useCallback(() => {
        reactionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
        reactionTimersRef.current.clear();
        seenReactionIdsRef.current.clear();
        setReactions([]);
    }, []);

    const stopVoice = useCallback(() => {
        if (!voiceRef.current) {
            return;
        }
        voiceRef.current.stop();
        voiceRef.current = null;
        setVoiceStatus('Idle');
        setActiveSpeakers(new Set());
        setPeerStates(new Map());
        setVideoTracks(new Map());
        setPresentationState(null);
    }, []);

    const handleActiveSpeakers = useCallback((ids) => {
        setActiveSpeakers(new Set((ids || []).map((id) => Number(id))));
    }, []);

    // Per-peer voice connection state from the active driver (LiveKit or mesh).
    // state === null removes the peer (left / connection closed).
    const handlePeerStates = useCallback((userId, state) => {
        const id = Number(userId);
        if (!Number.isFinite(id)) {
            return;
        }
        setPeerStates((prev) => {
            if (state == null) {
                if (!prev.has(id)) {
                    return prev;
                }
                const next = new Map(prev);
                next.delete(id);
                return next;
            }
            const next = new Map(prev);
            next.set(id, state);
            return next;
        });
    }, []);

    // Camera/screen-share track from the active driver (LiveKit only). videoEl === null
    // removes the entry (track unpublished/unsubscribed).
    const handleVideoTrack = useCallback((userId, source, videoEl) => {
        const id = Number(userId);
        if (!Number.isFinite(id) || !source) {
            return;
        }
        const key = `${id}:${source}`;
        setVideoTracks((prev) => {
            if (videoEl == null) {
                if (!prev.has(key)) {
                    return prev;
                }
                const next = new Map(prev);
                next.delete(key);
                return next;
            }
            const next = new Map(prev);
            next.set(key, videoEl);
            return next;
        });
    }, []);

    const toggleCamera = useCallback(async (enabled) => {
        if (!voiceRef.current?.setCameraEnabled) {
            return { ok: false };
        }
        return voiceRef.current.setCameraEnabled(enabled);
    }, []);

    const toggleScreenShare = useCallback(async (enabled) => {
        if (!voiceRef.current?.setScreenShareEnabled) {
            return { ok: false };
        }
        // A real screen share and a presentation both publish under the same
        // ScreenShare source — starting one while the other is live would
        // fight over that slot, so switching to a real share ends any active
        // presentation first.
        if (enabled && voiceRef.current?.stopPresentation) {
            await voiceRef.current.stopPresentation();
        }
        return voiceRef.current.setScreenShareEnabled(enabled);
    }, []);

    // Presentation ("upload a video, present it, draw on it") — LiveKit-only.
    const handlePresentationState = useCallback((state) => {
        setPresentationState(state);
    }, []);

    const startPresentation = useCallback(async (file) => {
        if (!voiceRef.current?.startPresentation) {
            return { ok: false };
        }
        // Mutual exclusion with a real screen share, same reasoning as above.
        if (voiceRef.current?.setScreenShareEnabled) {
            await voiceRef.current.setScreenShareEnabled(false).catch(() => {});
        }
        return voiceRef.current.startPresentation(file);
    }, []);

    const stopPresentation = useCallback(async () => {
        if (!voiceRef.current?.stopPresentation) {
            return { ok: false };
        }
        return voiceRef.current.stopPresentation();
    }, []);

    const presentationPlay = useCallback(() => {
        voiceRef.current?.presentationPlay?.();
    }, []);

    const presentationPause = useCallback(() => {
        voiceRef.current?.presentationPause?.();
    }, []);

    const presentationSeek = useCallback((seconds) => {
        voiceRef.current?.presentationSeek?.(seconds);
    }, []);

    const getPresentationCanvas = useCallback(() => voiceRef.current?.getPresentationCanvas?.() ?? null, []);

    const setPresentationDrawing = useCallback((enabled) => {
        voiceRef.current?.setPresentationDrawing?.(enabled);
    }, []);

    const presentationClearDrawing = useCallback(() => {
        voiceRef.current?.presentationClearDrawing?.();
    }, []);

    const presentationPointerDown = useCallback((x, y) => {
        voiceRef.current?.presentationPointerDown?.(x, y);
    }, []);

    const presentationPointerMove = useCallback((x, y) => {
        voiceRef.current?.presentationPointerMove?.(x, y);
    }, []);

    const clearSession = useCallback(() => {
        if (pollTimerRef.current) {
            window.clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        if (heartbeatTimerRef.current) {
            window.clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
        roomPollBackoffRef.current = null;
        pendingUnlockRef.current = false;
        stopVoice();
        clearReactions();
        setActiveStageId(null);
        setChatOpen(false);
        setChatUnread(0);
        seenMessageCountRef.current = 0;
        setRoom(null);
        setLoading(false);
    }, [stopVoice, clearReactions]);

    const applyRoom = useCallback(
        (nextRoom) => {
            if (!nextRoom?.stage?.id) {
                return;
            }

            const messageCount = nextRoom.messages?.length ?? 0;
            const isNewStage = activeStageIdRef.current !== nextRoom.stage.id;

            if (isNewStage) {
                seenMessageCountRef.current = messageCount;
                setChatUnread(0);
                setChatOpen(false);
            } else if (chatOpenRef.current) {
                seenMessageCountRef.current = messageCount;
                setChatUnread(0);
            } else {
                setChatUnread(Math.max(0, messageCount - seenMessageCountRef.current));
            }

            ingestReactions(nextRoom.reactions, nextRoom.me?.user_id ?? null, { seed: isNewStage });

            setActiveStageId(nextRoom.stage.id);
            setRoom(nextRoom);
            setLoading(false);
        },
        [ingestReactions],
    );

    const enterFromPage = useCallback(
        (pageProps) => {
            const next = roomFromPageProps(pageProps);
            if (!next) {
                return;
            }
            pendingUnlockRef.current = true;
            applyRoom(next);
            unlockVoicePlaybackRef.current?.();
        },
        [applyRoom],
    );

    const syncFromPage = useCallback(
        (pageProps) => {
            const next = roomFromPageProps(pageProps);
            if (!next) {
                return;
            }
            if (activeStageIdRef.current && activeStageIdRef.current !== next.stage.id) {
                return;
            }
            applyRoom(next);
        },
        [applyRoom],
    );

    // Returns a rollback closure over the pre-patch snapshot (via roomRef,
    // kept in sync with `room` — setRoom itself is async/batched, so this
    // can't just read `room` and expect it to still be "before" by the time
    // the caller's mutation actually fails). Every optimistic mutation
    // should pass the returned rollback into withRollbackFlash's `rollback`
    // option so a failed POST puts the room back the way it was instead of
    // leaving the optimistic (wrong) state up until the next poll/Echo
    // update corrects it.
    const patchRoom = useCallback((updater) => {
        const previous = roomRef.current;
        setRoom((prev) => {
            if (!prev) {
                return prev;
            }
            return typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        });
        return () => setRoom(previous);
    }, []);

    const unlockVoicePlayback = useCallback(() => {
        if (voiceRef.current?.unlockPlayback) {
            pendingUnlockRef.current = false;
            void voiceRef.current.unlockPlayback();
            return;
        }
        pendingUnlockRef.current = true;
        setVoiceStatus('Connecting audio…');
    }, []);

    const retryMicAccess = useCallback(async () => {
        unlockVoicePlayback();
        if (voiceRef.current?.retryMicAccess) {
            return voiceRef.current.retryMicAccess();
        }
        // Start voice / promote can race session mount — warm getUserMedia in this gesture.
        setVoiceStatus('Requesting microphone…');
        const result = await requestStageMicrophone({ keepStream: false });
        if (!result.ok) {
            setVoiceStatus(result.error.status);
            return result;
        }
        setVoiceStatus('Mic allowed — connecting voice…');
        return { ok: true };
    }, [unlockVoicePlayback]);

    unlockVoicePlaybackRef.current = unlockVoicePlayback;

    // Reactions the local user throws: animate instantly, no round-trip wait.
    const pushReaction = useCallback((emoji) => animateEmoji(emoji), [animateEmoji]);

    const closeChat = useCallback(() => setChatOpen(false), []);
    const openChat = useCallback(() => {
        const count = roomRef.current?.messages?.length ?? 0;
        seenMessageCountRef.current = count;
        setChatUnread(0);
        setChatOpen(true);
    }, []);

    // Audio-output controls for the in-room audio menu (voice hooks read the store directly).
    const audioOutput = useMemo(
        () => ({
            volume: audioOutputState.volume,
            setVolume: setOutputVolume,
        }),
        [audioOutputState],
    );

    const fetchRoom = useCallback(
        async (stageId) => {
            const res = await fetch(`/social/stage/${stageId}/room`, {
                credentials: 'same-origin',
                headers: csrfHeaders(),
            });
            if (res.status === 401 || res.status === 403) {
                clearSession();
                return { error: res.status };
            }
            if (res.status === 429) {
                return { error: 429 };
            }
            if (!res.ok) {
                return { error: res.status };
            }
            return { data: await res.json() };
        },
        [clearSession],
    );

    // Poll room while session is active — skipped when Reverb Echo is connected/healthy.
    useEffect(() => {
        if (!activeStageId) {
            if (pollTimerRef.current) {
                window.clearTimeout(pollTimerRef.current);
                pollTimerRef.current = null;
            }
            roomPollBackoffRef.current = null;
            return undefined;
        }

        const reverbPrimary = room?.realtime?.mode === 'reverb' && echoConnected;
        // When WS is up, only a slow safety poll (missed events). When down, normal poll.
        const basePollMs = reverbPrimary
            ? Math.max(room?.poll_ms || 3000, 60000)
            : room?.poll_ms || 3000;
        let cancelled = false;
        let delayMs = roomPollBackoffRef.current || basePollMs;

        const schedule = (ms) => {
            if (cancelled) {
                return;
            }
            pollTimerRef.current = window.setTimeout(tick, ms);
        };

        const tick = async () => {
            // Connection may have recovered mid-loop — back off to safety interval.
            const wsUp = room?.realtime?.mode === 'reverb' && echoConnectedRef.current;
            const result = await fetchRoom(activeStageId);
            if (cancelled || activeStageIdRef.current !== activeStageId) {
                return;
            }

            if (result?.error === 429) {
                delayMs = Math.min(Math.max(delayMs, basePollMs) * 2, 60000);
                roomPollBackoffRef.current = delayMs;
                schedule(delayMs);
                return;
            }

            if (result?.error === 401 || result?.error === 403) {
                return;
            }

            const data = result?.data;
            if (!data) {
                schedule(Math.min(delayMs * 1.5, 30000));
                return;
            }

            if (!data.me) {
                clearSession();
                return;
            }

            delayMs = wsUp
                ? Math.max(data.poll_ms ?? basePollMs, 60000)
                : data.poll_ms ?? basePollMs;
            roomPollBackoffRef.current = null;

            applyRoom({
                stage: data.stage,
                participants: data.participants || [],
                messages: data.messages || [],
                pinned_message: data.pinned_message ?? null,
                reactions: data.reactions || [],
                reaction_options: data.reaction_options || [],
                me: data.me ?? null,
                voice: data.voice ?? null,
                realtime: data.realtime ?? null,
                max_message_length: data.max_message_length ?? 280,
                poll_ms: data.poll_ms ?? basePollMs,
            });

            schedule(delayMs);
        };

        // If Reverb is primary and connected, delay first HTTP tick (WS delivers room.updated).
        schedule(reverbPrimary ? basePollMs : 0);
        return () => {
            cancelled = true;
            if (pollTimerRef.current) {
                window.clearTimeout(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
    }, [activeStageId, room?.poll_ms, room?.realtime?.mode, echoConnected, applyRoom, clearSession, fetchRoom]);

    // Presence heartbeat. Stage membership is liveness-driven: a light 7s beat
    // keeps last_seen_at fresh, and the server prunes only participants whose
    // heartbeat has gone silent past PRESENCE_TIMEOUT_SECONDS — i.e. the app is
    // actually gone (closed, killed, or offline). Leaving the browser tab
    // (switching away, minimising, even closing it) no longer releases the seat:
    // a backgrounded listener is still hearing the room, so we keep beating while
    // hidden and let the offline timeout be the only involuntary removal. The
    // explicit Leave button stays the way to intentionally give up the seat.
    // A failed beat never drops the session — a transient blip must not eject the
    // user (the poll's own 401/403 path handles real auth loss).
    useEffect(() => {
        if (!activeStageId) {
            return undefined;
        }
        const stageId = activeStageId;
        const HEARTBEAT_MS = 7000;

        const beat = () => {
            fetch(`/social/stage/${stageId}/heartbeat`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: csrfHeaders(),
            }).catch(() => {});
        };

        // Regaining focus after the tab was backgrounded (and its timers throttled)
        // refreshes last_seen_at at once instead of waiting for the next tick.
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                beat();
            }
        };

        beat();
        heartbeatTimerRef.current = window.setInterval(beat, HEARTBEAT_MS);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            if (heartbeatTimerRef.current) {
                window.clearInterval(heartbeatTimerRef.current);
                heartbeatTimerRef.current = null;
            }
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [activeStageId]);

    // Prefer Reverb for stage messages / signals / reactions / room changes; poll is fallback.
    useEffect(() => {
        if (!activeStageId || room?.realtime?.mode !== 'reverb') {
            return undefined;
        }

        const echo = getEcho();
        if (!echo) {
            return undefined;
        }

        const name = `social.stage.${activeStageId}`;
        const refreshRoom = async () => {
            const result = await fetchRoom(activeStageId);
            const data = result?.data;
            if (!data || activeStageIdRef.current !== activeStageId) {
                return;
            }
            if (!data.me) {
                clearSession();
                return;
            }
            applyRoom({
                stage: data.stage,
                participants: data.participants || [],
                messages: data.messages || [],
                pinned_message: data.pinned_message ?? null,
                reactions: data.reactions || [],
                reaction_options: data.reaction_options || [],
                me: data.me ?? null,
                voice: data.voice ?? null,
                realtime: data.realtime ?? null,
                max_message_length: data.max_message_length ?? 280,
                poll_ms: data.poll_ms ?? room?.poll_ms ?? 3000,
            });
        };

        const channel = echo
            .private(name)
            .listen('.message.created', (payload) => {
                const message = payload?.message;
                if (!message?.id) {
                    return;
                }
                patchRoom((prev) => {
                    const existing = prev.messages || [];
                    if (existing.some((m) => m.id === message.id)) {
                        return prev;
                    }
                    const withoutOptimistic = existing.filter(
                        (m) => !(m._optimistic && m.body === message.body),
                    );
                    return { ...prev, messages: [...withoutOptimistic, message] };
                });
            })
            .listen('.reaction.created', (payload) => {
                const reaction = payload?.reaction;
                if (!reaction?.emoji) {
                    return;
                }
                ingestReactions([reaction], roomRef.current?.me?.user_id ?? null);
            })
            .listen('.room.updated', () => {
                refreshRoom();
            });

        return () => {
            channel.stopListening('.message.created');
            channel.stopListening('.reaction.created');
            channel.stopListening('.room.updated');
            leaveEchoChannel(name);
        };
    }, [activeStageId, room?.realtime?.mode, applyRoom, clearSession, fetchRoom, patchRoom, ingestReactions]);

    // Per-recipient WebRTC signal channel (SDP/ICE) — see
    // StageSignalCreated::broadcastOn and the matching authorization in
    // routes/channels.php. Kept as its own effect since it needs our own
    // user id, which isn't known until the room payload above has loaded —
    // folding it into the room-events effect would force that one to
    // resubscribe every time `me` changes for unrelated reasons.
    useEffect(() => {
        const meId = room?.me?.user_id;
        if (!activeStageId || room?.realtime?.mode !== 'reverb' || !meId) {
            return undefined;
        }

        const echo = getEcho();
        if (!echo) {
            return undefined;
        }

        const name = `social.stage.${activeStageId}.user.${meId}`;
        const channel = echo.private(name).listen('.signal.created', (payload) => {
            const signal = payload?.signal;
            if (!signal) {
                return;
            }
            voiceRef.current?.ingestSignals?.([signal]);
        });

        return () => {
            channel.stopListening('.signal.created');
            leaveEchoChannel(name);
        };
    }, [activeStageId, room?.realtime?.mode, room?.me?.user_id]);

    // Keep Stage voice mounted for the life of the session (on the room route or off it).
    useEffect(() => {
        const stage = room?.stage;
        const me = room?.me;
        const isLive = stage?.status === 'live';

        if (!isLive || !me || !stage?.id) {
            stopVoice();
            return undefined;
        }

        const voiceEnabled = Boolean(stage.voice_enabled);
        const onStage = Boolean(me.on_stage);
        const voiceDriver = room?.voice?.driver === 'livekit' ? 'livekit' : 'mesh';
        // Mesh keeps the HTTP /signals drain running even under reverb-primary — a
        // slow safety net (the server sends signal_poll_ms >= 8s in that mode) that
        // re-catches any SDP/ICE the socket dropped. This mirrors the room-state
        // safety poll above; without it, a single missed .signal.created event
        // silently kills voice with no fallback. drainSignals marks each signal
        // consumed exactly once and the WS handlers are idempotent for dual
        // delivery, so running WS + poll together is harmless.
        const allowHttpSignals = voiceDriver === 'mesh';
        const boundStageId = voiceRef.current?.stageId;
        const boundDriver = voiceRef.current?.driver;

        if (voiceRef.current && (boundStageId !== stage.id || boundDriver !== voiceDriver)) {
            stopVoice();
        }

        if (!voiceRef.current) {
            const session = createStageVoiceSession({
                driver: voiceDriver,
                stageId: stage.id,
                myUserId: me.user_id,
                getParticipants: () => roomRef.current?.participants || [],
                voiceEnabled,
                iAmOnStage: onStage,
                isMuted: Boolean(me.is_muted),
                signalPollMs: room?.voice?.signal_poll_ms || 1500,
                iceServers: room?.voice?.ice_servers || null,
                allowHttpSignals,
                onStatus: setVoiceStatus,
                onActiveSpeakers: handleActiveSpeakers,
                onPeerState: handlePeerStates,
                onVideoTrack: handleVideoTrack,
                onPresentationState: handlePresentationState,
            });
            session.stageId = stage.id;
            voiceRef.current = session;
            session.start();
            pendingUnlockRef.current = false;
            void session.unlockPlayback?.();
        } else {
            voiceRef.current.update({
                voiceEnabled,
                iAmOnStage: onStage,
                isMuted: Boolean(me.is_muted),
                signalPollMs: room?.voice?.signal_poll_ms || 1500,
                iceServers: room?.voice?.ice_servers || null,
                allowHttpSignals,
                getParticipants: () => roomRef.current?.participants || [],
            });
        }

        return undefined;
    }, [
        room?.stage?.id,
        room?.stage?.status,
        room?.stage?.voice_enabled,
        room?.me?.user_id,
        room?.me?.on_stage,
        room?.me?.is_muted,
        room?.voice?.driver,
        room?.voice?.signal_poll_ms,
        room?.voice?.ice_servers,
        room?.realtime?.mode,
        echoConnected,
        stopVoice,
        handleActiveSpeakers,
        handlePeerStates,
        handleVideoTrack,
        handlePresentationState,
    ]);

    // If autoplay is blocked, retry on the next page interaction (not a dedicated button).
    useEffect(() => {
        if (!activeStageId || !room?.stage?.voice_enabled) {
            return undefined;
        }

        const blocked = String(voiceStatus || '').toLowerCase().includes('tap anywhere');
        if (!blocked) {
            return undefined;
        }

        function retryFromInteraction() {
            unlockVoicePlaybackRef.current?.();
        }

        document.addEventListener('pointerdown', retryFromInteraction, { once: true, passive: true });
        document.addEventListener('keydown', retryFromInteraction, { once: true });

        return () => {
            document.removeEventListener('pointerdown', retryFromInteraction);
            document.removeEventListener('keydown', retryFromInteraction);
        };
    }, [activeStageId, room?.stage?.voice_enabled, voiceStatus]);

    // Track the current route; drop chat-open when navigating off the room (keep listening).
    useEffect(() => {
        const remove = router.on('success', (event) => {
            const nextUrl = event.detail?.page?.url || '';
            const path = String(nextUrl).split('?')[0];
            setCurrentPath(path);

            const stageId = activeStageIdRef.current;
            if (stageId && !isStageRoomPath(path, stageId)) {
                setChatOpen(false);
            }
        });

        return remove;
    }, []);

    useEffect(() => () => {
        // Provider unmount (leaving Social SPA) tears everything down.
        if (pollTimerRef.current) {
            window.clearTimeout(pollTimerRef.current);
        }
        reactionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
        reactionTimersRef.current.clear();
        voiceRef.current?.stop();
    }, []);

    // Keep unread badge in sync when optimistic patchRoom adds messages while chat is closed.
    useEffect(() => {
        if (!activeStageId || !room) {
            return;
        }
        const messageCount = room.messages?.length ?? 0;
        if (chatOpen) {
            seenMessageCountRef.current = messageCount;
            setChatUnread(0);
            return;
        }
        setChatUnread(Math.max(0, messageCount - seenMessageCountRef.current));
    }, [activeStageId, room?.messages?.length, chatOpen, room]);

    const isOnStageRoute = Boolean(activeStageId) && isStageRoomPath(currentPath, activeStageId);

    // Roll up per-peer voice states over the current on-stage speakers (excluding
    // me) into the aggregate that drives the header pill + connection panel.
    const voiceConnection = useMemo(() => {
        const myId = room?.me?.user_id;
        const speakerIds = (room?.participants || [])
            .filter((p) => p.on_stage && Number(p.user_id) !== Number(myId))
            .map((p) => Number(p.user_id));
        return reduceVoiceConnection(peerStates, speakerIds);
    }, [room?.participants, room?.me?.user_id, peerStates]);

    const api = useMemo(
        () => ({
            activeStageId,
            chatOpen,
            chatUnread,
            isOnStageRoute,
            room,
            reactions,
            activeSpeakers,
            peerStates,
            videoTracks,
            presentationState,
            voiceConnection,
            audioOutput,
            voiceStatus,
            loading,
            enterFromPage,
            syncFromPage,
            patchRoom,
            pushReaction,
            openChat,
            closeChat,
            clearSession,
            setLoading,
            unlockVoicePlayback,
            retryMicAccess,
            toggleCamera,
            toggleScreenShare,
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
        }),
        [
            activeStageId,
            chatOpen,
            chatUnread,
            isOnStageRoute,
            room,
            reactions,
            activeSpeakers,
            peerStates,
            videoTracks,
            presentationState,
            voiceConnection,
            audioOutput,
            voiceStatus,
            loading,
            enterFromPage,
            syncFromPage,
            patchRoom,
            pushReaction,
            openChat,
            closeChat,
            clearSession,
            unlockVoicePlayback,
            retryMicAccess,
            toggleCamera,
            toggleScreenShare,
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
        ],
    );

    return <StageSessionContext.Provider value={api}>{children}</StageSessionContext.Provider>;
}

export function useStageSession() {
    const ctx = useContext(StageSessionContext);
    if (!ctx) {
        throw new Error('useStageSession must be used within StageSessionProvider');
    }
    return ctx;
}

export function useStageSessionOptional() {
    return useContext(StageSessionContext);
}
