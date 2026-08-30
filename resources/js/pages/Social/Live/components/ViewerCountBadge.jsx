import { formatCount } from './formatCount';

/**
 * Odometer-style viewer count (see .kf-odometer in stage-kickoff.css) — each
 * digit is individually keyed so only the digits that actually changed
 * replay the roll animation, not the whole number.
 */
export default function ViewerCountBadge({ count }) {
    const formatted = formatCount(count);

    return (
        <span className="kf-odometer" aria-label={`${count} watching`}>
            {formatted.split('').map((char, index) => (
                <span key={`${index}-${char}`} className="kf-odometer__digit">
                    {char}
                </span>
            ))}
        </span>
    );
}
