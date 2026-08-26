import { useEffect, useRef, useState } from 'react';

function IconMuted() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path strokeLinecap="round" strokeWidth="1.8" d="m16 9 5 6M21 9l-5 6" />
        </svg>
    );
}

function IconUnmuted() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path strokeLinecap="round" strokeWidth="1.8" d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" />
        </svg>
    );
}

/**
 * Looping video that autoplays muted (required for autoplay everywhere) while
 * in view and pauses when scrolled away. Starts muted; pass `allowUnmute` to
 * show a toggle button letting the viewer opt into sound.
 */
export default function AutoplayVideo({
    src,
    poster,
    className = '',
    rootMargin = '120px 0px',
    threshold = 0.45,
    controls = false,
    allowUnmute = false,
}) {
    const videoRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) {
            return undefined;
        }

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting || entry.intersectionRatio < threshold) {
                        video.pause();
                        return;
                    }

                    if (reducedMotion) {
                        return;
                    }

                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(() => {});
                    }
                });
            },
            { root: null, rootMargin, threshold: [threshold, 0.75] },
        );

        observer.observe(video);

        return () => observer.disconnect();
    }, [rootMargin, src, threshold]);

    return (
        <div className={`mf-autoplay-video ${ready ? 'is-ready' : ''} ${failed ? 'is-failed' : ''} ${className}`.trim()}>
            {!ready && !failed ? <span className="mf-autoplay-video__skel" aria-hidden /> : null}
            <video
                ref={videoRef}
                className="mf-autoplay-video__el"
                src={src}
                poster={poster || undefined}
                muted={muted}
                loop
                playsInline
                preload="metadata"
                controls={controls}
                onLoadedData={() => setReady(true)}
                onError={() => setFailed(true)}
            />
            {allowUnmute ? (
                <button
                    type="button"
                    className="mf-media__mute-btn"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setMuted((value) => !value);
                    }}
                    aria-label={muted ? 'Unmute video' : 'Mute video'}
                    title={muted ? 'Unmute' : 'Mute'}
                >
                    {muted ? <IconMuted /> : <IconUnmuted />}
                </button>
            ) : null}
        </div>
    );
}
