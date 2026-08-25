import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../../lib/defaultImage';
import AutoplayVideo from './AutoplayVideo';
import MediaLightbox from './MediaLightbox';

function isVideoItem(item) {
    return item?.type === 'video' || /\.(mp4|webm)(\?|$)/i.test(item?.url || '');
}

/**
 * Attachment grid. Media keeps its natural aspect ratio (no fixed-height crop);
 * tapping any tile opens the fullscreen lightbox at that index.
 * Videos autoplay muted while on-screen.
 *
 * @param {{ media: Array }} props
 */
export default function MediaGrid({ media }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const [viewer, setViewer] = useState(-1);

    if (!media?.length) {
        return null;
    }

    const count = Math.min(media.length, 4);
    const items = media.slice(0, 4);
    const single = count === 1;

    return (
        <>
            <div
                className={`mf-media mf-media--${count}${single ? ' mf-media--solo' : ''}`}
                role="group"
                aria-label="Attachments"
            >
                {items.map((item, index) => {
                    const video = isVideoItem(item);

                    return (
                        <button
                            type="button"
                            key={item.id ?? index}
                            className={`mf-media__cell mf-media__cell--${index + 1}${video ? ' mf-media__cell--video' : ''}`}
                            aria-label={video ? 'View video' : 'View media'}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setViewer(index);
                            }}
                        >
                            {video ? (
                                <AutoplayVideo src={item.url} className="mf-media__video" />
                            ) : (
                                <img
                                    src={item.url}
                                    alt=""
                                    loading="lazy"
                                    width={item.width || undefined}
                                    height={item.height || undefined}
                                    onError={(event) => onImageError(event, fallbackUrl)}
                                />
                            )}
                            {video ? (
                                <span className="mf-media__video-badge" aria-hidden>
                                    Video
                                </span>
                            ) : null}
                            {index === 3 && media.length > 4 ? (
                                <span className="mf-media__more" aria-hidden>
                                    +{media.length - 4}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {viewer >= 0 ? (
                <MediaLightbox
                    media={media}
                    index={viewer}
                    onClose={() => setViewer(-1)}
                    onIndexChange={setViewer}
                />
            ) : null}
        </>
    );
}
