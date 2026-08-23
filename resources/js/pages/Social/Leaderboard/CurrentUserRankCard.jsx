import FanAvatar from './FanAvatar';
import LoyaltyScoreBadge from './LoyaltyScoreBadge';

/**
 * Sticky summary of the viewer's own standing — anchors the board when the fan
 * sits outside the visible top slots.
 */
export default function CurrentUserRankCard({ entry, totalFans }) {
    if (!entry) {
        return null;
    }

    const { rank, points, loyalty, fan } = entry;

    return (
        <div className="mf-lb-you">
            <div className="mf-lb-you__lead">
                <span className="mf-lb-you__rank mf-mono">#{rank}</span>
                <FanAvatar fan={fan} size="md" />
                <span className="mf-lb-you__identity">
                    <span className="mf-lb-you__handle">@{fan.handle}</span>
                    <span className="mf-lb-you__meta mf-text-micro">
                        {points.toLocaleString()} pts
                        {totalFans ? ` · of ${totalFans.toLocaleString()} fans` : ''}
                    </span>
                </span>
            </div>
            <LoyaltyScoreBadge loyalty={loyalty} size="md" />
        </div>
    );
}
