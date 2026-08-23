import { useStageSession } from './StageSessionContext';

/**
 * Floating emoji reactions drawn over the speaker deck. Entries come from the
 * session (`pushReaction` for the local user, Echo/poll for everyone else) and
 * expire on their own timer, so this layer is purely presentational.
 *
 * Horizontal start, drift and desync are derived from each entry's sequence key
 * so a given emoji keeps a stable path across re-renders (no `Math.random`).
 */
function pathFor(key) {
    const n = Number(String(key).split('-')[1] || 0);

    return {
        left: 6 + ((n * 37) % 86), // 6%..92% of the deck width
        drift: ((n * 53) % 44) - 22, // -22px..22px horizontal wander
        scale: 0.9 + ((n * 13) % 5) / 10, // 0.9..1.3 size variety
    };
}

export default function ReactionLayer() {
    const { reactions } = useStageSession();

    if (!reactions?.length) {
        return null;
    }

    return (
        <div className="mf-stage-reactions" aria-hidden="true">
            {reactions.map(({ key, emoji }) => {
                const { left, drift, scale } = pathFor(key);

                return (
                    <span
                        key={key}
                        className="mf-stage-reactions__item"
                        style={{
                            left: `${left}%`,
                            '--mf-rx-drift': `${drift}px`,
                            '--mf-rx-scale': scale,
                        }}
                    >
                        {emoji}
                    </span>
                );
            })}
        </div>
    );
}
