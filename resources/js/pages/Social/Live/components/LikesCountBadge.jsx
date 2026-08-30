import { IconHeart } from '../../Stage/StageIcons';
import { formatCount } from './formatCount';

/**
 * Running total of every reaction thrown on this stage — the "likes" count,
 * shown to host and viewers alike. Same odometer digit-roll as
 * ViewerCountBadge; baseline comes from LiveStageService::reactionCount(),
 * ticks up in realtime via `.reaction.created` (see LiveStageSessionContext).
 */
export default function LikesCountBadge({ count }) {
    const formatted = formatCount(count);

    return (
        <span className="kf-odometer kf-odometer--likes" aria-label={`${count} likes`}>
            <IconHeart className="kf-odometer__icon" />
            {formatted.split('').map((char, index) => (
                <span key={`${index}-${char}`} className="kf-odometer__digit">
                    {char}
                </span>
            ))}
        </span>
    );
}
