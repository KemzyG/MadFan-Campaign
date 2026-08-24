import EventShell from '../EventShell';
import { formatCount } from '../../post/format';
import { IconPlay } from '../icons';
import { formatDuration } from '../time';

/**
 * new_episode — a reel that just landed. The thumbnail is the card: 16:9 media
 * with a play affordance, duration chip, and the view/like tally beneath.
 */
export default function NewEpisodeCard({ event }) {
    const {
        thumbnail_url: thumbnail,
        duration_seconds: duration,
        views_count: views = 0,
        likes_count: likes = 0,
        is_featured: featured,
        author,
    } = event.data || {};

    return (
        <EventShell event={event} tone="pitch" bleed>
            <div className="mf-evreel">
                <div className="mf-evreel__media">
                    {thumbnail ? (
                        <img src={thumbnail} alt="" loading="lazy" />
                    ) : (
                        <span className="mf-evreel__placeholder" aria-hidden />
                    )}

                    <span className="mf-evreel__scrim" aria-hidden />

                    <span className="mf-evreel__play" aria-hidden>
                        <IconPlay />
                    </span>

                    {featured ? <span className="mf-evreel__featured">FEATURED</span> : null}

                    {duration ? (
                        <span className="mf-evreel__duration">{formatDuration(duration)}</span>
                    ) : null}
                </div>

                <div className="mf-evreel__copy">
                    <p className="mf-evreel__title">{event.headline}</p>
                    {event.subtitle ? <p className="mf-evreel__caption">{event.subtitle}</p> : null}

                    <p className="mf-evreel__meta">
                        {author?.name ? <span className="mf-evreel__author">{author.name}</span> : null}
                        <span>{formatCount(views)} views</span>
                        <span>{formatCount(likes)} likes</span>
                    </p>
                </div>
            </div>
        </EventShell>
    );
}
