import FanAvatar from './FanAvatar';
import LoyaltyScoreBadge from './LoyaltyScoreBadge';

const ORDER = [1, 0, 2]; // 2nd, 1st, 3rd — classic podium arrangement

/**
 * Top-three podium. Falls back to natural order if fewer than three fans exist.
 */
export default function TopFansPodium({ entries = [] }) {
    const top = entries.slice(0, 3);

    if (top.length === 0) {
        return null;
    }

    const arranged = top.length === 3 ? ORDER.map((i) => top[i]) : top;

    return (
        <ol className="mf-lb-podium" aria-label="Top fans">
            {arranged.map((entry) => (
                <li
                    key={entry.fan.id}
                    className={`mf-lb-podium__slot mf-lb-podium__slot--${entry.rank}${entry.is_you ? ' is-you' : ''}`}
                >
                    <span className="mf-lb-podium__rank mf-display">{entry.rank}</span>
                    <FanAvatar fan={entry.fan} size="lg" />
                    <span className="mf-lb-podium__handle">@{entry.fan.handle}</span>
                    {entry.fan.club?.name ? (
                        <span className="mf-lb-podium__club mf-text-micro">{entry.fan.club.name}</span>
                    ) : null}
                    <span className="mf-lb-podium__points mf-mono">{entry.points.toLocaleString()} pts</span>
                    <LoyaltyScoreBadge loyalty={entry.loyalty} size="md" />
                </li>
            ))}
        </ol>
    );
}
