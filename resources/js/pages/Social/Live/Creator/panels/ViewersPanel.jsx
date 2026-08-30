/**
 * The host's live roster — everyone currently watching, with mute/remove/ban
 * actions on each row. Backed by useLiveStageViewers, which refetches on
 * every viewer-count change (there's no per-viewer join/leave broadcast —
 * see LiveStageViewerCountUpdated) plus a slow poll as a safety net.
 */
export default function ViewersPanel({ viewers, loading, onMute, onRemove }) {
    if (loading && viewers.length === 0) {
        return <p className="kf-studio__viewers-empty">Loading viewers…</p>;
    }

    if (viewers.length === 0) {
        return <p className="kf-studio__viewers-empty">No one has joined yet.</p>;
    }

    return (
        <div className="kf-studio__viewers">
            {viewers.map((viewer) => (
                <div key={viewer.user.id} className="kf-studio__viewer-row">
                    <span className="kf-studio__viewer-avatar" aria-hidden>
                        {viewer.user.avatar_emoji || '🙂'}
                    </span>
                    <div className="kf-studio__viewer-meta">
                        <span className="kf-studio__viewer-name">{viewer.user.name}</span>
                        {viewer.user.handle ? (
                            <span className="kf-studio__viewer-handle">@{viewer.user.handle}</span>
                        ) : null}
                    </div>
                    <span className="kf-studio__viewer-actions">
                        <button
                            type="button"
                            className="kf-comments__mod-btn"
                            onClick={() => onMute?.(viewer.user.id, !viewer.is_muted_by_host)}
                        >
                            {viewer.is_muted_by_host ? 'Unmute' : 'Mute'}
                        </button>
                        <button
                            type="button"
                            className="kf-comments__mod-btn"
                            onClick={() => onRemove?.(viewer.user.id, false)}
                        >
                            Remove
                        </button>
                        <button
                            type="button"
                            className="kf-comments__mod-btn"
                            onClick={() => onRemove?.(viewer.user.id, true)}
                        >
                            Ban
                        </button>
                    </span>
                </div>
            ))}
        </div>
    );
}
