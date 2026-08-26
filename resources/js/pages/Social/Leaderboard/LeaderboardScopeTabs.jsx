import { router } from '@inertiajs/react';

/**
 * Global / Fandom / My club switcher. Each tab re-requests the same page with
 * a new `scope` (+ `fandom_id`/`club_id`), so every club effectively gets its
 * own board without a dedicated route per club.
 */
export default function LeaderboardScopeTabs({ scope, club, viewerFandom, viewerClub }) {
    if (!viewerFandom && !viewerClub) {
        return null;
    }

    function go(nextScope, params = {}) {
        router.get(
            '/social/leaderboard',
            { scope: nextScope, ...params },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    const tabs = [
        { key: 'global', label: 'Global', onClick: () => go('global') },
        viewerFandom
            ? { key: 'fandom', label: viewerFandom.name, onClick: () => go('fandom', { fandom_id: viewerFandom.id }) }
            : null,
        viewerClub
            ? {
                  key: 'club',
                  label: viewerClub.short || viewerClub.name,
                  onClick: () => go('club', { club_id: viewerClub.id }),
              }
            : null,
    ].filter(Boolean);

    // Viewing another club's board (reached from that club's profile) doesn't
    // highlight "My club" — it isn't the viewer's own club.
    const activeKey = scope === 'club' && club?.id !== viewerClub?.id ? null : scope;

    return (
        <div className="mf-lb-scope-tabs" role="tablist" aria-label="Leaderboard scope">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={activeKey === tab.key}
                    className={activeKey === tab.key ? 'is-active' : ''}
                    onClick={tab.onClick}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
