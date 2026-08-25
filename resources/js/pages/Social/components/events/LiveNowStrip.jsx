import { Link } from '@inertiajs/react';

function StageAvatar({ host }) {
    if (host?.avatar_url) {
        return <img src={host.avatar_url} alt="" className="mf-ev-live__img" />;
    }
    if (host?.avatar_emoji) {
        return (
            <span className="mf-ev-live__emoji" aria-hidden>
                {host.avatar_emoji}
            </span>
        );
    }
    return (
        <span className="mf-ev-live__initial" aria-hidden>
            {(host?.name || '?').slice(0, 1).toUpperCase()}
        </span>
    );
}

/**
 * Horizontal strip of every publicly broadcasting Stage — a host-avatar ring
 * per stage, linking straight into the room. Surfaces the same live stages
 * that become livestream/live_event cards further down, just earlier.
 */
export default function LiveNowStrip({ stages = [] }) {
    if (stages.length === 0) {
        return null;
    }

    return (
        <div className="mf-ev-live" role="list" aria-label="Live now">
            {stages.map((stage) => (
                <Link
                    key={stage.id}
                    href={stage.join_url}
                    className="mf-ev-live__item"
                    role="listitem"
                    aria-label={`${stage.title} — join live`}
                >
                    <span className="mf-ev-live__ring">
                        <StageAvatar host={stage.host} />
                    </span>
                    <span className="mf-ev-live__label">{stage.title}</span>
                </Link>
            ))}
        </div>
    );
}
