/**
 * Floating emoji overlay — purely decorative, driven by the ephemeral
 * `reaction.created` broadcast (see LiveStageSessionContext). Each entry
 * removes itself from state after REACTION_TTL_MS; this component just
 * renders whatever's currently in flight with a randomised drift so a burst
 * of the same emoji doesn't stack in a single column.
 */
export default function ReactionsLayer({ reactions }) {
    return (
        <div className="kf-reactions-layer" aria-hidden>
            {reactions.map((r, i) => (
                <span
                    key={r.id}
                    className="kf-reactions-layer__item"
                    style={{
                        left: `${8 + ((i * 37) % 70)}%`,
                        animationDelay: `${(i % 5) * 60}ms`,
                    }}
                >
                    {r.emoji}
                </span>
            ))}
        </div>
    );
}
