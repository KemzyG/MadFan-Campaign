import { IconUserPlus } from '../post/icons';
import EmojiPicker from './EmojiPicker';
import VisibilityMenu from './VisibilityMenu';
import WhoCanReplyMenu from './WhoCanReplyMenu';

/**
 * Settings row beneath the composer body — audience, tag friends, who-can-reply,
 * and the emoji picker. All controls are disabled while a post is submitting.
 *
 * @param {{
 *   visibility: string,
 *   onVisibilityChange: (value:string) => void,
 *   replyScope: string,
 *   onReplyScopeChange: (value:string) => void,
 *   onTagClick: () => void,
 *   taggedCount: number,
 *   onEmoji: (emoji:string) => void,
 *   disabled?: boolean,
 * }} props
 */
export default function PostSettingsBar({
    visibility,
    onVisibilityChange,
    replyScope,
    onReplyScopeChange,
    onTagClick,
    taggedCount,
    onEmoji,
    disabled = false,
}) {
    return (
        <div className="mf-settings">
            <div className="mf-settings__row">
                <VisibilityMenu value={visibility} onChange={onVisibilityChange} disabled={disabled} />
                <WhoCanReplyMenu value={replyScope} onChange={onReplyScopeChange} disabled={disabled} />
            </div>

            <div className="mf-settings__tools">
                <button
                    type="button"
                    className={`mf-cchip mf-cchip--ghost${taggedCount > 0 ? ' is-active' : ''}`}
                    aria-label="Tag friends"
                    disabled={disabled}
                    onClick={onTagClick}
                >
                    <IconUserPlus />
                    <span>{taggedCount > 0 ? `${taggedCount} tagged` : 'Tag friends'}</span>
                </button>

                <EmojiPicker onPick={onEmoji} disabled={disabled} />
            </div>
        </div>
    );
}
