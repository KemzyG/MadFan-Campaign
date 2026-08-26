import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { IconMenu } from '../../../Layouts/SocialShell';
import { IconSettings } from '../Stage/StageIcons';
import YouNavSheet from './YouNavSheet';

/**
 * Sticky mobile-only header for the self "You" page (hidden ≥768px — see
 * `.mf-you-topbar` in you.css; desktop keeps SocialShell's generic header via
 * `hideHeaderOnMobile`). Two jobs live here instead of the generic bar: a menu
 * into the destinations that don't fit the bottom tab bar, and a direct line
 * into profile settings.
 */
export default function YouHeader({ onOpenSettings }) {
    const { props } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);
    const unreadCount = props?.notifications?.unread_count ?? 0;

    return (
        <>
            <header className="mf-you-topbar">
                <p className="mf-display mf-text-title truncate tracking-[0.03em] text-[var(--mf-pitch)] mf-you-topbar__title">
                    You
                </p>

                <div className="mf-you-topbar__actions">
                    <button
                        type="button"
                        className="mf-stage-icon-btn"
                        aria-label={unreadCount > 0 ? `Menu — ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'Menu'}
                        title="Menu"
                        onClick={() => setMenuOpen(true)}
                    >
                        <IconMenu />
                        {unreadCount > 0 ? (
                            <span className="mf-stage-icon-btn__badge mf-mono">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        ) : null}
                    </button>

                    <button
                        type="button"
                        className="mf-stage-icon-btn"
                        aria-label="Profile settings"
                        title="Settings"
                        onClick={onOpenSettings}
                    >
                        <IconSettings />
                    </button>
                </div>
            </header>

            <YouNavSheet
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                notificationsCount={unreadCount}
            />
        </>
    );
}
