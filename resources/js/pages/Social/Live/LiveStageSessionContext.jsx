import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { getEcho, leaveEchoChannel } from '../../../echo';
import * as api from './liveStageApi';

const LiveStageSessionContext = createContext(null);

const HEARTBEAT_MS = 15000;
const POLL_FALLBACK_MS = 6000;
const REACTION_TTL_MS = 3200;

/**
 * `connection` is the one thing every stage-type Studio/Viewer needs to
 * render a predictable state instead of a blank video element — see the
 * Live Stage spec §19/§20. Kept as a small state machine, not a boolean:
 *
 *   loading      → initial mount, haven't heard from the server yet
 *   waiting      → stage exists but host hasn't gone live
 *   live         → connected and receiving state
 *   reconnecting → had a connection, lost it, retrying
 *   ended        → stage transitioned to ended while we were here
 *   error        → couldn't reach the stage at all
 */
function deriveConnection(stage, echoConnected) {
    if (!stage) {
        return 'loading';
    }
    if (stage.status === 'ended' || stage.status === 'cancelled') {
        return 'ended';
    }
    if (!stage.is_live) {
        return 'waiting';
    }
    return echoConnected === false ? 'reconnecting' : 'live';
}

export function LiveStageSessionProvider({ initialStage, initialComments, children }) {
    const [stage, setStage] = useState(initialStage);
    const [comments, setComments] = useState(initialComments || []);
    const [reactions, setReactions] = useState([]);
    const [echoConnected, setEchoConnected] = useState(null);
    const [error, setError] = useState(null);

    const stageIdRef = useRef(initialStage?.id);
    const stageRef = useRef(stage);
    stageRef.current = stage;

    const connection = deriveConnection(stage, echoConnected);

    const refreshState = useCallback(async () => {
        const id = stageIdRef.current;
        if (!id) {
            return;
        }
        try {
            const result = await api.fetchStageState(id);
            if (result?.stage) {
                setStage(result.stage);
                setError(null);
            }
        } catch (err) {
            setError(err.message || 'Unable to reach this stage.');
        }
    }, []);

    // Real-time channel: viewer count, comments, reactions, moderation, lifecycle.
    useEffect(() => {
        const id = initialStage?.id;
        if (!id) {
            return undefined;
        }

        const echo = getEcho();
        if (!echo) {
            setEchoConnected(false);
            return undefined;
        }

        const name = `live-stage.${id}`;
        const connector = echo.connector?.pusher?.connection;
        const emitConnState = () => setEchoConnected(connector?.state === 'connected');
        connector?.bind('state_change', emitConnState);
        emitConnState();

        const channel = echo
            .private(name)
            .listen('.stage.started', () => {
                refreshState();
            })
            .listen('.stage.updated', () => {
                refreshState();
            })
            .listen('.stage.ended', () => {
                setStage((prev) => (prev ? { ...prev, status: 'ended', is_live: false } : prev));
            })
            .listen('.viewer-count.updated', (payload) => {
                setStage((prev) => (prev ? { ...prev, viewer_count: payload.viewer_count } : prev));
            })
            .listen('.comment.created', (payload) => {
                setComments((prev) => {
                    if (prev.some((c) => c.id === payload.id)) {
                        return prev;
                    }
                    return [...prev, payload].slice(-200);
                });
            })
            .listen('.comment.deleted', (payload) => {
                setComments((prev) => prev.filter((c) => c.id !== payload.id));
            })
            .listen('.reaction.created', (payload) => {
                const id2 = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                setReactions((prev) => [...prev, { id: id2, emoji: payload.emoji }]);
                window.setTimeout(() => {
                    setReactions((prev) => prev.filter((r) => r.id !== id2));
                }, REACTION_TTL_MS);
            })
            .listen('.viewer.moderated', (payload) => {
                window.dispatchEvent(
                    new CustomEvent('live-stage:moderated', { detail: payload }),
                );
            });

        return () => {
            connector?.unbind('state_change', emitConnState);
            channel.stopListening('.stage.started');
            channel.stopListening('.stage.ended');
            channel.stopListening('.viewer-count.updated');
            channel.stopListening('.comment.created');
            channel.stopListening('.comment.deleted');
            channel.stopListening('.reaction.created');
            channel.stopListening('.viewer.moderated');
            leaveEchoChannel(name);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialStage?.id]);

    // Poll fallback — covers the window before Echo connects and any drop.
    useEffect(() => {
        if (echoConnected) {
            return undefined;
        }
        const timer = window.setInterval(refreshState, POLL_FALLBACK_MS);
        return () => window.clearInterval(timer);
    }, [echoConnected, refreshState]);

    // Foreground heartbeat — keeps this viewer's presence session alive. A
    // guest never gets a tracked session (see LiveStageController::show), so
    // `stage.me` is null for them the same way it is pre-join — reuse that
    // rather than a 401 retry loop against an auth-only route every
    // HEARTBEAT_MS.
    useEffect(() => {
        const id = initialStage?.id;
        if (!id || initialStage?.is_host || !initialStage?.me) {
            return undefined;
        }
        const timer = window.setInterval(() => {
            api.heartbeat(id).catch(() => {});
        }, HEARTBEAT_MS);
        return () => window.clearInterval(timer);
    }, [initialStage?.id, initialStage?.is_host]);

    const postComment = useCallback(async (body) => {
        const id = stageIdRef.current;
        const optimisticId = `optimistic-${Date.now()}`;
        setComments((prev) => [...prev, { id: optimisticId, body, _optimistic: true, user: null }]);
        try {
            await api.postComment(id, body);
        } catch (err) {
            setComments((prev) => prev.filter((c) => c.id !== optimisticId));
            throw err;
        }
    }, []);

    const deleteComment = useCallback((commentId) => {
        const id = stageIdRef.current;
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        return api.deleteComment(id, commentId);
    }, []);

    const react = useCallback((emoji) => {
        const id = stageIdRef.current;
        return api.postReaction(id, emoji).catch(() => {});
    }, []);

    const muteViewer = useCallback((userId, muted) => {
        return api.muteViewer(stageIdRef.current, userId, muted);
    }, []);

    const removeViewer = useCallback((userId, ban = false) => {
        return api.removeViewer(stageIdRef.current, userId, ban);
    }, []);

    const updateSettings = useCallback(async (payload) => {
        const id = stageIdRef.current;
        const result = await api.updateStageSettings(id, payload);
        if (result?.stage) {
            setStage(result.stage);
        }
        return result?.stage;
    }, []);

    const value = useMemo(
        () => ({
            stage,
            comments,
            reactions,
            connection,
            error,
            refreshState,
            postComment,
            deleteComment,
            react,
            muteViewer,
            removeViewer,
            updateSettings,
        }),
        [stage, comments, reactions, connection, error, refreshState, postComment, deleteComment, react, muteViewer, removeViewer, updateSettings],
    );

    return (
        <LiveStageSessionContext.Provider value={value}>{children}</LiveStageSessionContext.Provider>
    );
}

export function useLiveStageSession() {
    const ctx = useContext(LiveStageSessionContext);
    if (!ctx) {
        throw new Error('useLiveStageSession must be used within LiveStageSessionProvider');
    }
    return ctx;
}
