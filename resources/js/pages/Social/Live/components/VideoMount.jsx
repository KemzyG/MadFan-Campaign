import { useCallback } from 'react';

/**
 * Mounts an externally-created `<video>` element (from LiveKit's
 * `track.attach()` or a raw getUserMedia preview) into this component's
 * DOM position. LiveKit/the browser own the element's lifecycle — we only
 * place it, never construct or destroy it ourselves.
 */
export default function VideoMount({ videoEl, className = '', mirrored = false }) {
    const mount = useCallback(
        (node) => {
            if (!node) {
                return;
            }
            const existing = node.querySelector('video');
            if (existing && existing !== videoEl) {
                existing.remove();
            }
            if (videoEl && videoEl.parentNode !== node) {
                videoEl.classList.add('kf-video-el');
                if (mirrored) {
                    videoEl.classList.add('kf-video-el--mirrored');
                }
                node.appendChild(videoEl);
            }
        },
        [videoEl, mirrored],
    );

    return <div className={className} ref={mount} />;
}
