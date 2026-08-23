import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconReaction } from './StageIcons';
import { useStageActions } from './useStageActions';
import { useStageSession } from './StageSessionContext';

const STORAGE_KEY = 'mf.stage.reactEmoji';
const FALLBACK = '🔥';
const LONG_PRESS_MS = 450;
// Send at most one network reaction per this window; every tap still animates
// locally, so a fast combo stays smooth without tripping the reaction limiter.
const SEND_THROTTLE_MS = 320;
const COMBO_RESET_MS = 900;

function readStoredEmoji() {
    try {
        return window.localStorage.getItem(STORAGE_KEY) || null;
    } catch {
        return null;
    }
}

function writeStoredEmoji(emoji) {
    try {
        window.localStorage.setItem(STORAGE_KEY, emoji);
    } catch {
        // Ignore — private mode / storage disabled just means no persistence.
    }
}

/**
 * Floating reaction button, fixed at the deck's bottom-right on every
 * breakpoint. Tap throws the current default emoji (instant local burst +
 * throttled server send); rapid taps stack a combo counter. Long-press opens a
 * picker to change the default, which is remembered in localStorage.
 */
export default function StageReactionFab() {
    const actions = useStageActions();
    const { pushReaction } = useStageSession();
    const options = actions.reactionOptions;

    const [stored, setStored] = useState(() => readStoredEmoji());
    const [picking, setPicking] = useState(false);
    const [combo, setCombo] = useState(0);

    const rootRef = useRef(null);
    const lastSendRef = useRef(0);
    const comboTimerRef = useRef(null);
    const pressTimerRef = useRef(null);
    const longFiredRef = useRef(false);
    const startPtRef = useRef(null);

    const list = options.length ? options : [FALLBACK];
    // Only honour a stored default that's still a valid server option.
    const current = useMemo(() => {
        if (stored && list.includes(stored)) {
            return stored;
        }
        return list[0] || FALLBACK;
    }, [stored, list]);

    useEffect(
        () => () => {
            window.clearTimeout(comboTimerRef.current);
            window.clearTimeout(pressTimerRef.current);
        },
        [],
    );

    const bumpCombo = useCallback(() => {
        setCombo((n) => n + 1);
        window.clearTimeout(comboTimerRef.current);
        comboTimerRef.current = window.setTimeout(() => setCombo(0), COMBO_RESET_MS);
    }, []);

    // One tap: always animate locally; only reach the server on the throttle edge.
    const fireOnce = useCallback(
        (emoji) => {
            if (!actions.canReact || !emoji) {
                return;
            }
            pushReaction(emoji);
            bumpCombo();
            const now = Date.now();
            if (now - lastSendRef.current >= SEND_THROTTLE_MS) {
                lastSendRef.current = now;
                actions.sendReaction(emoji);
            }
        },
        [actions, pushReaction, bumpCombo],
    );

    const chooseDefault = useCallback(
        (emoji) => {
            setStored(emoji);
            writeStoredEmoji(emoji);
            setPicking(false);
            fireOnce(emoji);
        },
        [fireOnce],
    );

    // Close the picker on Escape or an outside press.
    useEffect(() => {
        if (!picking) {
            return undefined;
        }
        function onKey(event) {
            if (event.key === 'Escape') {
                setPicking(false);
            }
        }
        function onPointer(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setPicking(false);
            }
        }
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointer);
        };
    }, [picking]);

    const onPointerDown = useCallback(
        (event) => {
            if (event.button != null && event.button !== 0) {
                return;
            }
            longFiredRef.current = false;
            startPtRef.current = { x: event.clientX, y: event.clientY };
            window.clearTimeout(pressTimerRef.current);
            pressTimerRef.current = window.setTimeout(() => {
                longFiredRef.current = true;
                setPicking(true);
            }, LONG_PRESS_MS);
        },
        [],
    );

    const cancelPress = useCallback(() => {
        window.clearTimeout(pressTimerRef.current);
    }, []);

    const onPointerMove = useCallback((event) => {
        const start = startPtRef.current;
        if (!start) {
            return;
        }
        // A drag/scroll cancels the pending long-press.
        if (Math.abs(event.clientX - start.x) > 10 || Math.abs(event.clientY - start.y) > 10) {
            window.clearTimeout(pressTimerRef.current);
        }
    }, []);

    const onPointerUp = useCallback(() => {
        window.clearTimeout(pressTimerRef.current);
        if (longFiredRef.current) {
            longFiredRef.current = false;
            return; // The long-press already opened the picker.
        }
        fireOnce(current);
    }, [current, fireOnce]);

    if (!actions.canReact) {
        return null;
    }

    return (
        <div className="mf-stage-react-fab" ref={rootRef}>
            {picking ? (
                <div className="mf-stage-react-fab__picker" role="menu" aria-label="Choose reaction">
                    {list.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            role="menuitemradio"
                            aria-checked={emoji === current}
                            className={`mf-stage-react-fab__opt ${emoji === current ? 'is-active' : ''}`.trim()}
                            onClick={() => chooseDefault(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            ) : null}

            <button
                type="button"
                className="mf-stage-react-fab__btn"
                aria-label={`Send ${current} reaction — long-press to change`}
                title={`React ${current} · long-press to change`}
                aria-haspopup="menu"
                aria-expanded={picking}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                onPointerMove={onPointerMove}
                onContextMenu={(event) => event.preventDefault()}
            >
                <span className="mf-stage-react-fab__emoji" aria-hidden>
                    {current}
                </span>
                <span className="mf-stage-react-fab__glyph" aria-hidden>
                    <IconReaction />
                </span>
                {combo > 1 ? (
                    <span className="mf-stage-react-fab__combo mf-mono" aria-hidden>
                        ×{combo}
                    </span>
                ) : null}
            </button>
        </div>
    );
}
