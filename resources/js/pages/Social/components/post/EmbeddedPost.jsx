import MediaGrid from './MediaGrid';

/**
 * Compact embed for a quoted or reposted post.
 *
 * @param {{ embed?: object, label?: string }} props
 */
export default function EmbeddedPost({ embed, label }) {
    if (!embed) {
        return null;
    }

    return (
        <div className="mf-embed">
            {label ? (
                <p className="mf-text-caption mb-1.5 text-[var(--mf-muted)]">{label}</p>
            ) : null}
            <p className="mf-text-meta text-[var(--mf-muted)]">
                <span className="font-semibold text-[var(--mf-text)]">{embed.author?.name}</span>
            </p>
            {embed.body ? (
                <p className="mf-text-ui mt-1 whitespace-pre-wrap text-[var(--mf-text)]">{embed.body}</p>
            ) : null}
            <MediaGrid media={embed.media} />
        </div>
    );
}
