/**
 * Compact loyalty-score pill: numeric score + letter grade, colour-neutral to
 * respect the monochrome system (grade communicated by weight, not hue).
 */
export default function LoyaltyScoreBadge({ loyalty, size = 'md' }) {
    if (!loyalty) {
        return null;
    }

    return (
        <span
            className={`mf-lb-score mf-lb-score--${size}`}
            title={`Loyalty score ${loyalty.score} of ${loyalty.max}`}
        >
            <span className="mf-lb-score__grade mf-display" data-grade={loyalty.grade}>
                {loyalty.grade}
            </span>
            <span className="mf-lb-score__value mf-mono">{loyalty.score}</span>
        </span>
    );
}
