import { IconClock } from './icons';
import { useCountdown, useElapsed, formatKickoff } from './time';

/**
 * LIVE / SOON / NEW status pill. The live variant carries a pulsing dot; the
 * upcoming variant counts down to the card's timestamp.
 */
export function PhasePill({ phase, pill, timestamp, showCountdown = true }) {
    const countdown = useCountdown(phase === 'upcoming' ? timestamp : null);
    const live = phase === 'live';

    return (
        <span className={`mf-ev-pill mf-ev-pill--${phase}`}>
            {live ? <span className="mf-ev-pill__dot" aria-hidden /> : null}
            {pill || phase?.toUpperCase()}
            {!live && showCountdown && countdown.target !== null && !countdown.past ? (
                <span className="mf-ev-pill__count">· {countdown.label}</span>
            ) : null}
        </span>
    );
}

/**
 * Big countdown block for cards that lead with "when" (concert, match, drop).
 * Falls back to the absolute stamp once the moment has passed.
 */
export function Countdown({ to, label = 'Starts in', compact = false }) {
    const { target, past, parts } = useCountdown(to);

    if (target === null) {
        return null;
    }

    if (past) {
        return (
            <p className="mf-ev-countdown mf-ev-countdown--past">
                <IconClock />
                <span>{formatKickoff(to)}</span>
            </p>
        );
    }

    const units = [
        { value: parts.days, unit: 'd' },
        { value: parts.hours, unit: 'h' },
        { value: parts.minutes, unit: 'm' },
    ];

    // Drop leading zero units so a 4-hour countdown doesn't read "00d".
    const firstMeaningful = units.findIndex((entry) => entry.value > 0);
    const shown = firstMeaningful === -1 ? units.slice(2) : units.slice(firstMeaningful);

    return (
        <div className={`mf-ev-countdown${compact ? ' is-compact' : ''}`}>
            <span className="mf-ev-countdown__label">{label}</span>
            <span className="mf-ev-countdown__units">
                {shown.map((entry) => (
                    <span key={entry.unit} className="mf-ev-countdown__unit">
                        <b>{String(entry.value).padStart(2, '0')}</b>
                        <i>{entry.unit}</i>
                    </span>
                ))}
            </span>
        </div>
    );
}

/** "24'" live clock for a match in play. */
export function LiveClock({ since }) {
    const minutes = useElapsed(since);

    if (minutes === null) {
        return null;
    }

    return <span className="mf-ev-clock">{minutes}&apos;</span>;
}
