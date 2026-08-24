import EventShell from '../EventShell';
import { formatDayLabel } from '../time';

/**
 * campaign — the running season, framed as a climb. Its identity is the meter:
 * a segmented week track with the current week marked, plus how long is left.
 */
export default function CampaignCard({ event }) {
    const {
        total_weeks: totalWeeks,
        current_week: currentWeek,
        progress,
        days_left: daysLeft,
        ends_at: endsAt,
    } = event.data || {};

    const weeks = Number(totalWeeks) || 0;
    const week = Number(currentWeek) || 0;
    const pct = Math.max(0, Math.min(100, Number(progress) || 0));

    return (
        <EventShell event={event} tone="gold">
            <p className="mf-evcamp__title">{event.headline}</p>

            <div className="mf-evcamp__meter">
                <div className="mf-evcamp__bar" role="img" aria-label={`${pct}% through the campaign`}>
                    <span className="mf-evcamp__fill" style={{ width: `${pct}%` }} />
                </div>

                {weeks > 0 ? (
                    <div className="mf-evcamp__weeks" aria-hidden>
                        {Array.from({ length: Math.min(weeks, 16) }, (_, index) => {
                            const number = index + 1;

                            return (
                                <span
                                    key={number}
                                    className={`mf-evcamp__week${number === week ? ' is-now' : ''}${
                                        number < week ? ' is-done' : ''
                                    }`}
                                />
                            );
                        })}
                    </div>
                ) : null}
            </div>

            <dl className="mf-evcamp__stats">
                {week > 0 ? (
                    <div>
                        <dt>Week</dt>
                        <dd>
                            {week}
                            {weeks > 0 ? <i>/{weeks}</i> : null}
                        </dd>
                    </div>
                ) : null}
                <div>
                    <dt>Progress</dt>
                    <dd>
                        {pct}
                        <i>%</i>
                    </dd>
                </div>
                {daysLeft != null ? (
                    <div>
                        <dt>Days left</dt>
                        <dd>{daysLeft}</dd>
                    </div>
                ) : null}
            </dl>

            {endsAt ? <p className="mf-evcamp__ends">Closes {formatDayLabel(endsAt)}</p> : null}
        </EventShell>
    );
}
