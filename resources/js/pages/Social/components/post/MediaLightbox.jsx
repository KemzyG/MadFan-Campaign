import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { onImageError, resolveDefaultImageUrl } from '../../../../lib/defaultImage';
import { usePage } from '@inertiajs/react';
import { IconChevronLeft, IconChevronRight, IconClose } from './icons';

function isVideoItem(item) {
    return item?.type === 'video' || /\.(mp4|webm)(\?|$)/i.test(item?.url || '');
}

/**
 * React doesn't reliably apply the `muted` JSX attribute to the underlying
 * DOM property before the browser evaluates `autoPlay` — a callback ref sets
 * it the instant the node mounts, ahead of that check, so autoplay never
 * starts with sound.
 */
function muteOnMount(node) {
    if (node) {
        node.muted = true;
    }
}

/**
 * Fullscreen media viewer. Shows one item at a time at natural aspect ratio,
 * with prev/next controls, keyboard navigation and backdrop/Escape close.
 *
 * @param {{ media: Array, index: number, onClose: () => void, onIndexChange: (i:number)=>void }} props
 */
export default function MediaLightbox({ media, index, onClose, onIndexChange }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const [current, setCurrent] = useState(index || 0);

    const total = media?.length || 0;

    useEffect(() => {
        setCurrent(index || 0);
    }, [index]);

    useEffect(() => {
        onIndexChange?.(current);
    }, [current, onIndexChange]);

    useEffect(() => {
        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            } else if (event.key === 'ArrowRight') {
                setCurrent((value) => (value + 1) % total);
            } else if (event.key === 'ArrowLeft') {
                setCurrent((value) => (value - 1 + total) % total);
            }
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [total, onClose]);

    if (!total) {
        return null;
    }

    const item = media[current];
    const hasMany = total > 1;
    const video = isVideoItem(item);

    function go(delta, event) {
        event?.stopPropagation();
        setCurrent((value) => (value + delta + total) % total);
    }

    return createPortal(
        <div className="mf-lightbox" role="dialog" aria-modal="true" aria-label="Media viewer">
            <button type="button" className="mf-lightbox__backdrop" aria-label="Close viewer" onClick={onClose} />

            <button type="button" className="mf-lightbox__close" aria-label="Close viewer" onClick={onClose}>
                <IconClose />
            </button>

            {hasMany ? (
                <p className="mf-lightbox__counter" aria-hidden>
                    {current + 1} / {total}
                </p>
            ) : null}

            <figure className="mf-lightbox__stage" onClick={onClose}>
                {video ? (
                    <video
                        key={item.id ?? current}
                        ref={muteOnMount}
                        className="mf-lightbox__video"
                        src={item.url}
                        controls
                        autoPlay
                        playsInline
                        muted
                        loop
                        onClick={(event) => event.stopPropagation()}
                    />
                ) : (
                    <img
                        key={item.id ?? current}
                        src={item.url}
                        alt=""
                        className="mf-lightbox__img"
                        onClick={(event) => event.stopPropagation()}
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                )}
            </figure>

            {hasMany ? (
                <>
                    <button
                        type="button"
                        className="mf-lightbox__nav mf-lightbox__nav--prev"
                        aria-label="Previous"
                        onClick={(event) => go(-1, event)}
                    >
                        <IconChevronLeft />
                    </button>
                    <button
                        type="button"
                        className="mf-lightbox__nav mf-lightbox__nav--next"
                        aria-label="Next"
                        onClick={(event) => go(1, event)}
                    >
                        <IconChevronRight />
                    </button>
                </>
            ) : null}
        </div>,
        document.body,
    );
}
