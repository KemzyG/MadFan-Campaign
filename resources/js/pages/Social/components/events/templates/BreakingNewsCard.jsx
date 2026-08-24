import EventShell from '../EventShell';
import { IconAlert } from '../icons';

/**
 * breaking_news — a wire bulletin. A rail down the left edge, the category as a
 * kicker, the headline in heavy display type, and the source credited beneath.
 * Urgent bulletins turn the rail and kicker red.
 */
export default function BreakingNewsCard({ event }) {
    const { image_url: image, source, is_urgent: urgent, category } = event.data || {};

    return (
        <EventShell event={event} tone={urgent ? 'alert' : 'pitch'}>
            <div className={`mf-evwire${urgent ? ' is-urgent' : ''}`}>
                <span className="mf-evwire__rail" aria-hidden />

                <div className="mf-evwire__copy">
                    <p className="mf-evwire__kicker">
                        {urgent ? <IconAlert /> : null}
                        {category || (urgent ? 'Urgent' : 'Newswire')}
                    </p>

                    <p className="mf-evwire__headline">{event.headline}</p>

                    {event.subtitle ? <p className="mf-evwire__standfirst">{event.subtitle}</p> : null}

                    {source ? (
                        <p className="mf-evwire__source">
                            <span className="mf-evwire__source-label">Source</span>
                            {source}
                        </p>
                    ) : null}
                </div>

                {image ? (
                    <div className="mf-evwire__thumb">
                        <img src={image} alt="" loading="lazy" />
                    </div>
                ) : null}
            </div>
        </EventShell>
    );
}
