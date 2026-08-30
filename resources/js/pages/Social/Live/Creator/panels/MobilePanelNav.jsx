import { IconChat, IconSettings, IconUsers } from '../../../Stage/StageIcons';

const NAV_ITEMS = [
    { key: 'messages', label: 'Messages', icon: IconChat },
    { key: 'viewers', label: 'Viewers', icon: IconUsers },
    { key: 'settings', label: 'Settings', icon: IconSettings },
];

/**
 * Mobile-only launcher for the Messages/Viewers/Settings panels — icon-only
 * circular FABs floating over the video, same register as the mic/camera
 * FABs. Below the ≥1024px breakpoint there's no room to dock the side panel
 * next to the camera monitor (see live-creator.css), so tapping one of these
 * opens that panel as a bottom-sheet overlay instead (see StudioSidePanel's
 * `mobileOpen` prop). This whole bar is CSS-hidden above the docked
 * breakpoint (.kf-studio__mobile-nav), so it always renders — no JS media
 * query needed.
 */
export default function MobilePanelNav({ commentCount, viewerCount, onOpen }) {
    const countFor = (key) => {
        if (key === 'messages') {
            return commentCount || null;
        }
        if (key === 'viewers') {
            return viewerCount || null;
        }
        return null;
    };

    return (
        <div className="kf-studio__mobile-nav">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const count = countFor(item.key);
                return (
                    <button
                        key={item.key}
                        type="button"
                        className="kf-studio__mobile-nav-btn"
                        onClick={() => onOpen(item.key)}
                        aria-label={item.label}
                    >
                        <Icon className="kf-studio__mobile-nav-icon" />
                        {count ? <span className="kf-studio__mobile-nav-count mf-mono">{count}</span> : null}
                    </button>
                );
            })}
        </div>
    );
}
