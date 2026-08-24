import EventShell from '../EventShell';
import { Countdown } from '../EventChrome';
import { IconPin } from '../icons';

/**
 * concert — a gig poster. Full-bleed artwork with the artist set in display type
 * over it, the venue line beneath, and the support acts as a lineup strip.
 */
export default function ConcertCard({ event }) {
    const { image_url: image, artist, venue, city, lineup = [], starts_at: startsAt } = event.data || {};

    const place = [venue, city].filter(Boolean).join(' · ');
    const support = Array.isArray(lineup) ? lineup.filter(Boolean) : [];

    return (
        <EventShell event={event} tone="pitch" bleed>
            <div className="mf-evgig">
                <div className="mf-evgig__poster">
                    {image ? (
                        <img src={image} alt="" loading="lazy" />
                    ) : (
                        <span className="mf-evgig__placeholder" aria-hidden />
                    )}

                    <span className="mf-evgig__scrim" aria-hidden />

                    <div className="mf-evgig__over">
                        {artist ? <p className="mf-evgig__artist">{artist}</p> : null}
                        <p className="mf-evgig__title">{event.headline}</p>
                        {place ? (
                            <p className="mf-evgig__place">
                                <IconPin />
                                {place}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="mf-evgig__foot">
                    {support.length > 0 ? (
                        <p className="mf-evgig__lineup">
                            <span className="mf-evgig__lineup-label">With</span>
                            {support.map((act) => (
                                <span key={act} className="mf-evgig__act">
                                    {act}
                                </span>
                            ))}
                        </p>
                    ) : null}

                    {startsAt ? <Countdown to={startsAt} label="Doors in" compact /> : null}
                </div>
            </div>
        </EventShell>
    );
}
