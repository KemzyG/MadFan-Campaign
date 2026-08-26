import { linkifyText } from '../../../../lib/linkify';

/**
 * Post body text. In the feed it is clamped to a fixed number of lines
 * (`clamp`); in detail/thread views it renders in full. Bare URLs render as
 * clickable links (reused for replies/comments — this component is shared).
 *
 * @param {{ text?: string, clamp?: boolean, size?: 'ui'|'body' }} props
 */
export default function PostText({ text, clamp = false, size = 'body' }) {
    if (!text) {
        return null;
    }

    const sizeClass = size === 'ui' ? 'mf-text-ui' : 'mf-text-body';

    return (
        <p
            className={`mf-post__text whitespace-pre-wrap ${sizeClass}${clamp ? ' mf-post__text--clamp' : ''}`}
        >
            {linkifyText(text)}
        </p>
    );
}
