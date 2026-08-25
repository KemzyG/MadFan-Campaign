import { useEffect, useRef, useState } from 'react';

/**
 * Muted looping video that autoplays while in view and pauses when scrolled away.
 */
export default function AutoplayVideo({
    src,
    poster,
    className = '',
    rootMargin = '120px 0px',
    threshold = 0.45,
    controls = false,
}) {
    const videoRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

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

                    video.muted = true;
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
                muted
                loop
                playsInline
                preload="metadata"
                controls={controls}
                onLoadedData={() => setReady(true)}
                onError={() => setFailed(true)}
            />
        </div>
    );
}
