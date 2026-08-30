import { IconChat, IconClose, IconSettings, IconUsers } from '../../../Stage/StageIcons';
import MessagesPanel from './MessagesPanel';
import SettingsPanel from './SettingsPanel';
import ViewersPanel from './ViewersPanel';

const TABS = [
    { key: 'messages', label: 'Messages', icon: IconChat },
    { key: 'viewers', label: 'Viewers', icon: IconUsers },
    { key: 'settings', label: 'Settings', icon: IconSettings },
];

/**
 * The Studio's tabbed panel — Messages, Viewers, and Settings share this one
 * dock (see .kf-studio__side) since only one needs the host's attention at a
 * time; the Mirror panel next to it is the only thing that stays put.
 *
 * Docked beside the Mirror panel on desktop (≥1024px, always visible). Below
 * that there's no room to dock it, so it renders as a bottom-sheet overlay
 * instead — `mobileOpen`/`onMobileClose` control that; MobilePanelNav (see
 * CreatorStudio) is what opens it, by calling `onTabChange` + implicitly
 * setting `mobileOpen` true in the parent. The backdrop and close button
 * below are inert (CSS-hidden) at the desktop breakpoint.
 */
export default function StudioSidePanel({
    stage,
    comments,
    onPostComment,
    onDeleteComment,
    onMuteViewer,
    onRemoveViewer,
    viewers,
    viewersLoading,
    onUpdateSettings,
    activeTab,
    onTabChange,
    mobileOpen,
    onMobileClose,
}) {
    const tabCount = (key) => {
        if (key === 'messages') {
            return comments.length || null;
        }
        if (key === 'viewers') {
            return stage.viewer_count || null;
        }
        return null;
    };

    return (
        <>
            {mobileOpen ? (
                <button
                    type="button"
                    className="kf-studio__side-backdrop"
                    aria-label="Close panel"
                    onClick={onMobileClose}
                />
            ) : null}

            <aside className={`kf-studio__side ${mobileOpen ? 'is-mobile-open' : ''}`}>
                <div className="kf-studio__tabs" role="tablist" aria-label="Studio panels">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const count = tabCount(tab.key);
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.key}
                                className={`kf-studio__tab ${activeTab === tab.key ? 'is-active' : ''}`}
                                onClick={() => onTabChange(tab.key)}
                            >
                                <Icon className="kf-studio__tab-icon" />
                                <span>{tab.label}</span>
                                {count ? <span className="kf-studio__tab-count mf-mono">{count}</span> : null}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        className="kf-studio__side-close"
                        aria-label="Close panel"
                        onClick={onMobileClose}
                    >
                        <IconClose />
                    </button>
                </div>

                <div className="kf-studio__panel">
                    {activeTab === 'messages' ? (
                        <MessagesPanel
                            comments={comments}
                            allowComments={stage.settings.allow_comments}
                            maxLength={stage.max_comment_length}
                            onSubmit={onPostComment}
                            onDelete={onDeleteComment}
                            onMuteUser={(userId) => onMuteViewer(userId, true)}
                            onRemoveUser={(userId) => onRemoveViewer(userId, false)}
                        />
                    ) : null}
                    {activeTab === 'viewers' ? (
                        <ViewersPanel
                            viewers={viewers}
                            loading={viewersLoading}
                            onMute={onMuteViewer}
                            onRemove={onRemoveViewer}
                        />
                    ) : null}
                    {activeTab === 'settings' ? <SettingsPanel stage={stage} onSave={onUpdateSettings} /> : null}
                </div>
            </aside>
        </>
    );
}
