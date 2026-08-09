import { useCallback, useEffect, useRef, useState } from 'react';

const THRESHOLD_PX = 68;
const MAX_PULL_PX = 112;
const DAMPING = 0.42;
const SCROLL_TOP_SLACK = 2;

function scrollTop() {
    return window.scrollY || document.documentElement.scrollTop || 0;
}

function isInteractiveTarget(target) {
    if (!(target instanceof Element)) {
        return false;
    }

    return Boolean(
        target.closest(
            'a, button, input, textarea, select, label, [role="button"], [role="tab"], [contenteditable="true"], .mf-fab, .mf-stage-fab, .mf-sheet, .mf-stage-modal',
        ),
    );
}

/**
 * Window-scroll pull-to-refresh (mobile-first; pointer also works on desktop).
 * Does not own overflow — expect document/window scrolling like Social home.
 */
export default function PullToRefresh({
    children,
    onRefresh,
    disabled = false,
    threshold = THRESHOLD_PX,
}) {
    const [pull, setPull] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const pullRef = useRef(0);
    const tracking = useRef(null);
    const armed = useRef(false);

    const setPullBoth = useCallback((value) => {
        pullRef.current = value;
        setPull(value);
    }, []);

    const finishRefresh = useCallback(() => {
        setRefreshing(false);
        setPullBoth(0);
    }, [setPullBoth]);

    const triggerRefresh = useCallback(() => {
        if (refreshing || disabled) {
            setPullBoth(0);
            return;
        }

        setRefreshing(true);
        setPullBoth(Math.min(threshold, 56));

        const result = onRefresh?.();
        Promise.resolve(result).finally(finishRefresh);
    }, [disabled, finishRefresh, onRefresh, refreshing, setPullBoth, threshold]);

    useEffect(() => {
        if (disabled) {
            tracking.current = null;
            armed.current = false;
            if (!refreshing) {
                setPullBoth(0);
            }
        }
    }, [disabled, refreshing, setPullBoth]);

    useEffect(() => {
        function onPointerDown(event) {
            if (disabled || refreshing) {
                return;
            }

            if (event.pointerType === 'mouse' && event.button !== 0) {
                return;
            }

            if (scrollTop() > SCROLL_TOP_SLACK) {
                return;
            }

            if (isInteractiveTarget(event.target)) {
                return;
            }

            tracking.current = {
                id: event.pointerId,
                startY: event.clientY,
                startX: event.clientX,
                dragging: false,
            };
            armed.current = false;
        }

        function onPointerMove(event) {
            const track = tracking.current;
            if (!track || track.id !== event.pointerId || disabled || refreshing) {
                return;
            }

            const dy = event.clientY - track.startY;
            const dx = event.clientX - track.startX;

            if (!track.dragging) {
                if (dy < 8) {
                    return;
                }
                if (Math.abs(dx) > Math.abs(dy) * 0.85) {
                    tracking.current = null;
                    setPullBoth(0);
                    return;
                }
                if (scrollTop() > SCROLL_TOP_SLACK) {
                    tracking.current = null;
                    return;
                }
                track.dragging = true;
                armed.current = true;
            }

            if (dy <= 0) {
                setPullBoth(0);
                return;
            }

            event.preventDefault();
            const damped = Math.min(MAX_PULL_PX, dy * DAMPING);
            setPullBoth(damped);
        }

        function endPointer(event) {
            const track = tracking.current;
            if (!track || track.id !== event.pointerId) {
                return;
            }

            const shouldRefresh = armed.current && pullRef.current >= threshold && !disabled && !refreshing;
            tracking.current = null;
            armed.current = false;

            if (shouldRefresh) {
                triggerRefresh();
                return;
            }

            if (!refreshing) {
                setPullBoth(0);
            }
        }

        document.addEventListener('pointerdown', onPointerDown, { passive: true });
        document.addEventListener('pointermove', onPointerMove, { passive: false });
        document.addEventListener('pointerup', endPointer);
        document.addEventListener('pointercancel', endPointer);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', endPointer);
            document.removeEventListener('pointercancel', endPointer);
        };
    }, [disabled, refreshing, setPullBoth, threshold, triggerRefresh]);

    const progress = Math.min(1, pull / threshold);
    const visible = pull > 4 || refreshing;
    const ready = !refreshing && pull >= threshold;

    return (
        <div
            className={`mf-ptr${refreshing ? ' is-refreshing' : ''}${ready ? ' is-ready' : ''}`}
            data-ptr={visible ? 'active' : undefined}
        >
            <div
                className="mf-ptr__indicator"
                style={{
                    height: visible ? Math.max(pull, refreshing ? 52 : 0) : 0,
                    opacity: visible ? Math.max(0.35, progress) : 0,
                }}
                aria-hidden={!visible}
            >
                <div className="mf-ptr__visual" aria-live="polite">
                    {refreshing ? (
                        <>
                            <span className="mf-ptr__bones" aria-hidden>
                                <span className="mf-skel-bone mf-ptr__bone" />
                                <span className="mf-skel-bone mf-ptr__bone mf-ptr__bone--short" />
                            </span>
                            <span className="mf-ptr__label mf-text-caption">Loading latest</span>
                        </>
                    ) : (
                        <>
                            <span
                                className="mf-ptr__chev"
                                style={{ transform: `rotate(${ready ? 180 : progress * 180}deg)` }}
                                aria-hidden
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeWidth="2" d="M12 5v12M7 12l5 5 5-5" />
                                </svg>
                            </span>
                            <span className="mf-ptr__label mf-text-caption">
                                {ready ? 'Release to refresh' : 'Pull for new posts'}
                            </span>
                        </>
                    )}
                </div>
            </div>

            <div className="mf-ptr__content">
                {children}
            </div>
        </div>
    );
}
