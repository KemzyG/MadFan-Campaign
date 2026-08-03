import { useCallback, useEffect, useRef, useState } from 'react';

const BODY_CLASS = 'pso-fullscreen-active';

/**
 * CSS + Fullscreen API hybrid for mobile shootout play.
 * Prefers a fixed viewport overlay (reliable on iOS Safari).
 *
 * @returns {{
 *   isFullscreen: boolean,
 *   toggleFullscreen: () => void,
 *   exitFullscreen: () => void,
 *   surfaceRef: import('react').RefObject<HTMLDivElement|null>,
 * }}
 */
export function useShootoutFullscreen() {
    const surfaceRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const [isFullscreen, setIsFullscreen] = useState(false);
    const scrollYRef = useRef(0);

    const exitFullscreen = useCallback(() => {
        setIsFullscreen(false);

        if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
        }
    }, []);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((current) => !current);
    }, []);

    useEffect(() => {
        const body = document.body;

        if (!isFullscreen) {
            body.classList.remove(BODY_CLASS);
            body.style.removeProperty('top');
            window.scrollTo(0, scrollYRef.current);

            return undefined;
        }

        scrollYRef.current = window.scrollY || window.pageYOffset || 0;
        body.classList.add(BODY_CLASS);
        body.style.top = `-${scrollYRef.current}px`;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                exitFullscreen();
            }
        };

        const onFullscreenChange = () => {
            if (!document.fullscreenElement && isFullscreen) {
                // Keep CSS overlay even if native fullscreen ends (iOS quirks).
            }
        };

        window.addEventListener('keydown', onKeyDown);
        document.addEventListener('fullscreenchange', onFullscreenChange);

        // Best-effort native fullscreen (desktop / Android). Failures are fine on iOS.
        const el = surfaceRef.current;
        if (el && !document.fullscreenElement && typeof el.requestFullscreen === 'function') {
            el.requestFullscreen().catch(() => {});
        }

        // Help R3F / layout recalculate after the container jumps to viewport size.
        requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        });

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            body.classList.remove(BODY_CLASS);
            body.style.removeProperty('top');
        };
    }, [isFullscreen, exitFullscreen]);

    useEffect(() => () => {
        document.body.classList.remove(BODY_CLASS);
        document.body.style.removeProperty('top');
    }, []);

    return {
        isFullscreen,
        toggleFullscreen,
        exitFullscreen,
        surfaceRef,
    };
}
