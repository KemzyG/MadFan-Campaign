/**
 * Compact always-visible reaction row (not a hidden picker) — the whole
 * point per the Live Stage spec §10/§36 is that a viewer's primary actions
 * are immediately obvious, not one tap away behind a menu.
 */
export default function ReactionFab({ options, onReact, disabled }) {
    if (disabled || !options?.length) {
        return null;
    }

    return (
        <div className="kf-reaction-fab" role="group" aria-label="React">
            {options.map((emoji) => (
                <button
                    key={emoji}
                    type="button"
                    className="kf-reaction-fab__btn"
                    aria-label={`React ${emoji}`}
                    onClick={() => onReact(emoji)}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}
