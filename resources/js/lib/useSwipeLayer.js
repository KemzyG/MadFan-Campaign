import { useCallback, useMemo, useRef, useState } from 'react';

const DEFAULT_THRESHOLD = 0.28;

/**
 * Two horizontally-swipeable transparent panes stacked over some fixed
 * background content (a video) that this hook never touches or knows about —
 * it only tracks drag progress and hands back inline transforms for the two
 * panes. "front" (progress 0) shows by default; dragging/swiping right past
 * `threshold` commits to "chat" (progress 1); dragging left from there
 * commits back. Both panes move in lockstep, 1:1 with the pointer, like a
 * card being dragged — never a scroll, never touching the layer beneath them.
 *
 * Pointer Events (not touch-specific) so mouse-drag works too — useful for
 * desktop and for testing without a touchscreen. A gesture is still just one
 * way in: pair this with the explicit `openChat`/`closeChat`/`toggleChat`
 * for a tap affordance, since swipe-only interactions aren't discoverable or
 * accessible on their own (see spec — every primary action needs a
 * non-gesture path too).
 */
export function useSwipeLayer({ threshold = DEFAULT_THRESHOLD } = {}) {
    const [open, setOpen] = useState(false);
    const [progress, setProgressState] = useState(0); // 0 = front, 1 = chat
    const progressRef = useRef(0);
    const dragRef = useRef(null);
    const containerRef = useRef(null);

    const setProgress = useCallback((value) => {
        progressRef.current = value;
        setProgressState(value);
    }, []);

    const settle = useCallback(
        (finalOpen) => {
            setOpen(finalOpen);
            setProgress(finalOpen ? 1 : 0);
        },
        [setProgress],
    );

    const openChat = useCallback(() => settle(true), [settle]);
    const closeChat = useCallback(() => settle(false), [settle]);
    const toggleChat = useCallback(() => settle(!open), [settle, open]);

    const onPointerDown = useCallback((event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }
        const width = containerRef.current?.clientWidth || 1;
        dragRef.current = {
            startX: event.clientX,
            width,
            base: progressRef.current >= 0.5 ? 1 : 0,
            moved: false,
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
    }, []);

    const onPointerMove = useCallback(
        (event) => {
            const drag = dragRef.current;
            if (!drag) {
                return;
            }
            const deltaX = event.clientX - drag.startX;
            if (Math.abs(deltaX) > 4) {
                drag.moved = true;
            }
            setProgress(Math.min(1, Math.max(0, drag.base + deltaX / drag.width)));
        },
        [setProgress],
    );

    const onPointerUp = useCallback(() => {
        const drag = dragRef.current;
        if (!drag) {
            return;
        }
        dragRef.current = null;
        const opening = drag.base === 0;
        const finalOpen = opening ? progressRef.current > threshold : progressRef.current > 1 - threshold;
        settle(finalOpen);
    }, [threshold, settle]);

    const handlers = useMemo(
        () => ({ onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }),
        [onPointerDown, onPointerMove, onPointerUp],
    );

    return {
        containerRef,
        open,
        dragging: dragRef.current?.moved ?? false,
        handlers,
        openChat,
        closeChat,
        toggleChat,
        frontStyle: { transform: `translateX(${progress * 100}%)` },
        chatStyle: { transform: `translateX(${(progress - 1) * 100}%)` },
    };
}
