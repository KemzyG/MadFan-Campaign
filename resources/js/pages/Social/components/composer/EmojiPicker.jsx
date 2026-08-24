import { IconSmile } from '../post/icons';
import { usePopover } from './usePopover';

// Terrace-flavoured shortlist — football first, then the everyday reactions.
const EMOJIS = [
    '⚽️', '🔥', '🎉', '🏆', '🥅', '🧤', '📣', '💪',
    '🙌', '👏', '😂', '😅', '😍', '😭', '😤', '🤝',
    '💚', '⚡️', '🤯', '👀', '🫡', '🥶', '🐐', '🚀',
];

/**
 * Compact emoji popover — inserts the picked glyph into the composer body.
 */
export default function EmojiPicker({ onPick, disabled = false }) {
    const { open, setOpen, ref } = usePopover();

    return (
        <div className="mf-cmenu" ref={ref}>
            <button
                type="button"
                className="mf-composer-tool"
                aria-label="Add emoji"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
            >
                <IconSmile />
            </button>

            {open ? (
                <div className="mf-emoji-pop" role="menu" aria-label="Pick an emoji">
                    {EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            className="mf-emoji-pop__btn"
                            onClick={() => {
                                onPick(emoji);
                                setOpen(false);
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
