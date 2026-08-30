import { useCallback, useEffect, useState } from 'react';
import { fetchViewers } from '../liveStageApi';

/**
 * Roster for the host's Viewers panel. There is no per-viewer join/left
 * broadcast (see LiveStageViewerCountUpdated's own doc comment — only the
 * aggregate count is pushed in real time), so this refetches the full list
 * whenever `viewerCount` changes and otherwise falls back to a slow poll to
 * catch anything the count missed (e.g. a mute from another moderator tab).
 */
const POLL_MS = 20000;

export function useLiveStageViewers(stageId, isLive, viewerCount) {
    const [viewers, setViewers] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!stageId || !isLive) {
            return;
        }
        try {
            const result = await fetchViewers(stageId);
            setViewers(result?.viewers || []);
        } catch {
            // keep the last known roster on a transient failure
        } finally {
            setLoading(false);
        }
    }, [stageId, isLive]);

    useEffect(() => {
        if (!isLive) {
            setViewers([]);
            setLoading(false);
            return undefined;
        }
        refresh();
        const timer = window.setInterval(refresh, POLL_MS);
        return () => window.clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLive, refresh, viewerCount]);

    return { viewers, loading, refresh };
}
