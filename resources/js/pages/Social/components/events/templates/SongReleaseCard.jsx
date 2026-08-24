import EventShell from '../EventShell';
import { IconDisc } from '../icons';

/**
 * song_release — a record sleeve. Square artwork beside the track/artist block,
 * an "OUT NOW" stamp, and the platform it landed on. The only card in the feed
 * built on a square, which is exactly what makes it recognisable.
 */
export default function SongReleaseCard({ event }) {
    const { image_url: image, artist, track, album, platform } = event.data || {};

    return (
        <EventShell event={event} tone="pitch">
            <div className="mf-evdrop">
                <div className="mf-evdrop__sleeve">
                    {image ? (
                        <img src={image} alt="" loading="lazy" />
                    ) : (
                        <span className="mf-evdrop__placeholder" aria-hidden>
                            <IconDisc />
                        </span>
                    )}
                </div>

                <div className="mf-evdrop__copy">
                    <span className="mf-evdrop__stamp">OUT NOW</span>

                    <p className="mf-evdrop__track">{track || event.headline}</p>
                    {artist ? <p className="mf-evdrop__artist">{artist}</p> : null}

                    <p className="mf-evdrop__meta">
                        {album ? <span className="mf-evdrop__album">{album}</span> : null}
                        {platform ? <span className="mf-evdrop__platform">{platform}</span> : null}
                    </p>
                </div>
            </div>
        </EventShell>
    );
}
