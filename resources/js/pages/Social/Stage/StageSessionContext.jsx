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
import { createStageVoiceSession } from './useStageVoice';

const StageSessionContext = createContext(null);

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

function roomFromPageProps(props) {
    if (!props?.stage?.id) {
        return null;
    }

    return {
        stage: props.stage,
        participants: props.participants || [],
        messages: props.messages || [],
        me: props.me ?? null,
        voice: props.voice ?? null,
        realtime: props.realtime ?? null,
        max_message_length: props.max_message_length ?? 280,
        poll_ms: props.poll_ms ?? 3000,
    };
}

export function StageSessionProvider({ children }) {
    const [activeStageId, setActiveStageId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatUnread, setChatUnread] = useState(0);
    const [room, setRoom] = useState(null);
    const [voiceStatus, setVoiceStatus] = useState('Idle');
    const [loading, setLoading] = useState(false);

    const roomRef = useRef(null);
    const voiceRef = useRef(null);
    const pollTimerRef = useRef(null);
    const activeStageIdRef = useRef(null);
    const chatOpenRef = useRef(false);
    const seenMessageCountRef = useRef(0);
    const roomPollBackoffRef = useRef(null);
    const pendingUnlockRef = useRef(false);
    const unlockVoicePlaybackRef = useRef(() => {});
    const echoConnectedRef = useRef(false);
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

    // Track Reverb socket health so HTTP room/signal poll only runs when WS is down.
    useEffect(() => {
        if (room?.realtime?.mode !== 'reverb') {
            setEchoConnected(false);
            return undefined;
        }
        return subscribeEchoConnection(setEchoConnected);
    }, [room?.realtime?.mode]);

    const stopVoice = useCallback(() => {
        if (!voiceRef.current) {
            return;
        }
        voiceRef.current.stop();
        voiceRef.current = null;
        setVoiceStatus('Idle');
    }, []);

    const clearSession = useCallback(() => {
        if (pollTimerRef.current) {
            window.clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        roomPollBackoffRef.current = null;
        pendingUnlockRef.current = false;
        stopVoice();
        setActiveStageId(null);
        setModalOpen(false);
        setChatOpen(false);
        setChatUnread(0);
        seenMessageCountRef.current = 0;
        setRoom(null);
        setLoading(false);
    }, [stopVoice]);

    const applyRoom = useCallback((nextRoom, { openModal = false } = {}) => {
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

        setActiveStageId(nextRoom.stage.id);
        setRoom(nextRoom);
        setLoading(false);

        if (openModal) {
            setModalOpen(true);
        }
    }, []);

    const enterFromPage = useCallback(
        (pageProps) => {
            const next = roomFromPageProps(pageProps);
            if (!next) {
                return;
            }
            applyRoom(next, { openModal: true });
        },
        [applyRoom],
    );

    const syncFromPage = useCallback((pageProps) => {
        const next = roomFromPageProps(pageProps);
        if (!next) {
            return;
        }
        if (activeStageIdRef.current && activeStageIdRef.current !== next.stage.id) {
            return;
        }
        applyRoom(next);
    }, [applyRoom]);

    const patchRoom = useCallback((updater) => {
        setRoom((prev) => {
            if (!prev) {
                return prev;
            }
            return typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        });
    }, []);

    const unlockVoicePlayback = useCallback(() => {
        if (voiceRef.current?.unlockPlayback) {
            pendingUnlockRef.current = false;
            // Fire from the click/pointer handler so media.play() stays in the user gesture.
            void voiceRef.current.unlockPlayback();
            return;
        }
        pendingUnlockRef.current = true;
        setVoiceStatus('Preparing audio… tap again if needed');
    }, []);

    unlockVoicePlaybackRef.current = unlockVoicePlayback;

    const openModal = useCallback(() => {
        setModalOpen(true);
        unlockVoicePlaybackRef.current?.();
    }, []);
    const closeChat = useCallback(() => setChatOpen(false), []);
    const openChat = useCallback(() => {
        const count = roomRef.current?.messages?.length ?? 0;
        seenMessageCountRef.current = count;
        setChatUnread(0);
        setChatOpen(true);
    }, []);
    const minimize = useCallback(() => {
        setChatOpen(false);
        setModalOpen(false);
    }, []);
    const reopen = useCallback(() => {
        if (activeStageIdRef.current) {
            setModalOpen(true);
            unlockVoicePlaybackRef.current?.();
        }
    }, []);

    const fetchRoom = useCallback(async (stageId) => {
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
    }, [clearSession]);

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

    // Prefer Reverb for stage messages / signals / room changes; poll remains as fallback.
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
            .listen('.signal.created', (payload) => {
                const signal = payload?.signal;
                const meId = roomRef.current?.me?.user_id;
                if (!signal || !meId || Number(signal.to_user_id) !== Number(meId)) {
                    return;
                }
                voiceRef.current?.ingestSignals?.([signal]);
            })
            .listen('.room.updated', () => {
                refreshRoom();
            });

        return () => {
            channel.stopListening('.message.created');
            channel.stopListening('.signal.created');
            channel.stopListening('.room.updated');
            leaveEchoChannel(name);
        };
    }, [activeStageId, room?.realtime?.mode, applyRoom, clearSession, fetchRoom, patchRoom]);

    // Keep Stage voice mounted for the life of the session (modal open or minimized).
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
        const allowHttpSignals =
            voiceDriver === 'mesh' &&
            !(room?.realtime?.mode === 'reverb' && echoConnected);
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
            });
            session.stageId = stage.id;
            voiceRef.current = session;
            session.start();
            if (pendingUnlockRef.current) {
                pendingUnlockRef.current = false;
                void session.unlockPlayback();
            }
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
    ]);

    // Minimize when navigating away from the Stage show route (keep listening).
    useEffect(() => {
        const remove = router.on('success', (event) => {
            const stageId = activeStageIdRef.current;
            if (!stageId) {
                return;
            }

            const nextUrl = event.detail?.page?.url || '';
            const path = String(nextUrl).split('?')[0];
            const stillOnShow = path === `/social/stage/${stageId}`;

            if (!stillOnShow) {
                setChatOpen(false);
                setModalOpen(false);
            }
        });

        return remove;
    }, []);

    useEffect(() => () => {
        // Provider unmount (leaving Social SPA) tears everything down.
        if (pollTimerRef.current) {
            window.clearTimeout(pollTimerRef.current);
        }
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

    const api = useMemo(
        () => ({
            activeStageId,
            modalOpen,
            chatOpen,
            chatUnread,
            minimized: Boolean(activeStageId) && !modalOpen,
            room,
            voiceStatus,
            loading,
            enterFromPage,
            syncFromPage,
            patchRoom,
            openModal,
            openChat,
            closeChat,
            minimize,
            reopen,
            clearSession,
            setLoading,
            unlockVoicePlayback,
        }),
        [
            activeStageId,
            modalOpen,
            chatOpen,
            chatUnread,
            room,
            voiceStatus,
            loading,
            enterFromPage,
            syncFromPage,
            patchRoom,
            openModal,
            openChat,
            closeChat,
            minimize,
            reopen,
            clearSession,
            unlockVoicePlayback,
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
