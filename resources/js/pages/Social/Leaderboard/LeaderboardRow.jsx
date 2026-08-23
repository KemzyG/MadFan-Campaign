import FanAvatar from './FanAvatar';
import LoyaltyScoreBadge from './LoyaltyScoreBadge';

/**
 * One ranked fan on the board. `variant="highlight"` styles the viewer's own row.
 */
export default function LeaderboardRow({ entry }) {
    const { rank, points, loyalty, fan, is_you: isYou } = entry;
    const clubName = fan.club?.name;

    return (
        <li className={`mf-lb-row${isYou ? ' is-you' : ''}`}>
            <span className="mf-lb-row__rank mf-mono" aria-label={`Rank ${rank}`}>
                {rank}
            </span>

            <FanAvatar fan={fan} size="sm" />

            <span className="mf-lb-row__identity">
                <span className="mf-lb-row__handle">
                    @{fan.handle}
                    {isYou ? <span className="mf-lb-row__you-tag mf-text-micro">You</span> : null}
                </span>
                {clubName ? <span className="mf-lb-row__club mf-text-micro">{clubName}</span> : null}
            </span>

            <span className="mf-lb-row__points">
                <span className="mf-lb-row__points-value mf-mono">{points.toLocaleString()}</span>
                <span className="mf-lb-row__points-label mf-text-micro">pts</span>
            </span>

            <LoyaltyScoreBadge loyalty={loyalty} size="sm" />
        </li>
    );
}
