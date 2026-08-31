import { Link, router, usePage } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import ComposeSheet from '../pages/Social/components/composer/ComposeSheet';
import {
    SocialPageSkeleton,
    resolveSocialSkeletonKind,
    shouldShowSocialNavSkeleton,
    visitPathname,
} from '../pages/Social/components/Skeletons';
import StageChrome from '../pages/Social/Stage/StageChrome';
import { AuthGateContext } from '../pages/Social/authGate';
import SignInGate from '../pages/Social/components/SignInGate';
import { SocialFlashContext, SocialNotificationsContext } from '../pages/Social/optimistic';
import { socialApi } from '../lib/socialApi';
import { getEcho, leaveEchoChannel } from '../echo';
import ChatRail from './ChatRail';

const NAV_SKELETON_DELAY_MS = 120;

const SocialComposeContext = createContext({
    openCompose: () => {},
    closeCompose: () => {},
    composeOpen: false,
});

export function useSocialCompose() {
    return useContext(SocialComposeContext);
}

function IconEvents({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle
                cx="12"
                cy="12"
                r={active ? 3.3 : 2.5}
                fill={active ? 'currentColor' : 'none'}
                stroke={active ? 'none' : 'currentColor'}
                strokeWidth="1.75"
            />
            <path
                strokeLinecap="round"
                strokeWidth={active ? 2.25 : 1.75}
                d="M7.4 7.4a6.5 6.5 0 0 0 0 9.2M16.6 16.6a6.5 6.5 0 0 0 0-9.2"
            />
            <path
                strokeLinecap="round"
                strokeWidth={active ? 2 : 1.55}
                opacity={active ? 0.7 : 0.45}
                d="M4.4 4.4a10.6 10.6 0 0 0 0 15.2M19.6 19.6a10.6 10.6 0 0 0 0-15.2"
            />
        </svg>
    );
}

function IconFeed({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.4" strokeWidth={active ? 2.25 : 1.75} />
            <circle cx="8" cy="9.6" r="1.6" fill={active ? 'currentColor' : 'none'} strokeWidth="1.5" />
            <path
                strokeLinecap="round"
                strokeWidth={active ? 2 : 1.6}
                d="M12.2 9.6H17M7 14h10M7 16.8h6.4"
            />
        </svg>
    );
}

function IconProfile({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="8.5" r="3.25" strokeWidth={active ? 2.25 : 1.75} />
            <path
                strokeLinecap="round"
                strokeWidth={active ? 2.25 : 1.75}
                d="M5.5 19.5c1.4-2.8 3.5-4.2 6.5-4.2s5.1 1.4 6.5 4.2"
            />
        </svg>
    );
}

function IconChat({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={active ? 2.25 : 1.75}
                d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4 3.2V16H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
            />
        </svg>
    );
}

export function IconMenu() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeWidth="1.85" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    );
}

export function IconBell() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M6 9.5a6 6 0 0 1 12 0v4.2l1.6 2.4H4.4L6 13.7V9.5Z"
            />
            <path strokeLinecap="round" strokeWidth="1.75" d="M9.7 18.5a2.4 2.4 0 0 0 4.6 0" />
        </svg>
    );
}

export function IconCampaign() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M4 19V5.8L12 4l8 1.8V19l-8-1.8L4 19Z"
            />
            <path strokeLinecap="round" strokeWidth="1.75" d="M12 4v13.2" />
        </svg>
    );
}

export function IconFandom({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeWidth={active ? 2.25 : 1.75} d="M6 20.5V4" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={active ? 2.1 : 1.65}
                fill={active ? 'currentColor' : 'none'}
                fillOpacity={active ? 0.18 : 0}
                d="M6 5c2.1-1.3 4-1.3 6 0s3.9 1.3 6 0v8.4c-2.1 1.3-4 1.3-6 0s-3.9-1.3-6 0V5Z"
            />
        </svg>
    );
}

export function IconShop({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={active ? 2.25 : 1.75}
                d="M6.5 9.5 8 5.5h8l1.5 4M5.5 9.5h13v8.2A1.8 1.8 0 0 1 16.7 19.5H7.3A1.8 1.8 0 0 1 5.5 17.7V9.5Z"
            />
            <path strokeLinecap="round" strokeWidth={active ? 2 : 1.6} d="M9.5 12.5v4M14.5 12.5v4" />
        </svg>
    );
}

export function IconLiveStage({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="3" y="6" width="14" height="12" rx="2.2" strokeWidth={active ? 2.1 : 1.7} />
            <path d="M17 10.2 21 7.5v9l-4-2.7" strokeWidth={active ? 2.1 : 1.7} strokeLinejoin="round" />
            <circle cx="7.2" cy="9.6" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function IconStage({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="3.1" strokeWidth={active ? 2.25 : 1.75} />
            <circle
                cx="12"
                cy="12"
                r="6.6"
                strokeWidth={active ? 2 : 1.6}
                strokeDasharray="3.2 2.4"
                opacity="0.9"
            />
            <circle
                cx="12"
                cy="12"
                r="9.4"
                strokeWidth={active ? 1.85 : 1.5}
                strokeDasharray="2.2 2.8"
                opacity="0.55"
            />
        </svg>
    );
}

function IconReels({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="7" y="3.5" width="10" height="17" rx="3" strokeWidth={active ? 2.25 : 1.75} />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={active ? 2.1 : 1.65}
                d="M10.4 9.2 15 12l-4.6 2.8V9.2Z"
                fill="currentColor"
                stroke="none"
            />
        </svg>
    );
}

function pathMatches(current, href, exact = false) {
    if (!current || !href) {
        return false;
    }

    if (exact) {
        return current === href || current.startsWith(`${href}?`);
    }

    return current === href || current.startsWith(`${href}/`) || current.startsWith(`${href}?`);
}

function BrandMark({ logoUrl }) {
    if (logoUrl) {
        return <img src={logoUrl} alt="" className="mf-sidebar__logo-img" />;
    }

    return <span className="mf-sidebar__logo-mark mf-display">MF</span>;
}

/**
 * Between 768 and 1279 the rail is icon-only and `.mf-sidebar__label` is
 * `display: none`, which takes the text out of the accessibility tree too. The
 * explicit label is what names the link there; `title` gives the collapsed rail
 * the hover tooltip users expect of one.
 */
function NavBadge({ count }) {
    if (!count) {
        return null;
    }

    return <span className="mf-sidebar__badge mf-mono">{count > 99 ? '99+' : count}</span>;
}

function NavItem({ href, label, icon: Icon, active, onClick, badge }) {
    const className = ['mf-sidebar__link', active ? 'is-active' : ''].filter(Boolean).join(' ');
    const ariaLabel = badge ? `${label}, ${badge} unread` : label;

    if (onClick && !href) {
        return (
            <button
                type="button"
                className={className}
                onClick={onClick}
                aria-label={ariaLabel}
                title={label}
            >
                <span className="mf-sidebar__icon">
                    <Icon active={active} />
                    <NavBadge count={badge} />
                </span>
                <span className="mf-sidebar__label">{label}</span>
            </button>
        );
    }

    return (
        <Link
            href={href}
            className={className}
            aria-current={active ? 'page' : undefined}
            aria-label={ariaLabel}
            title={label}
            prefetch
        >
            <span className="mf-sidebar__icon">
                <Icon active={active} />
                <NavBadge count={badge} />
            </span>
            <span className="mf-sidebar__label">{label}</span>
        </Link>
    );
}

function useDropdownMenu(open, setOpen, triggerRef) {
    const rootRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const firstItem = menuRef.current?.querySelector('[role="menuitem"]');
        firstItem?.focus?.();

        function onPointerDown(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                triggerRef.current?.focus?.();
            }
        }

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, setOpen, triggerRef]);

    return { rootRef, menuRef };
}

function HeaderMenuItem({ href, label, icon: Icon, active, onClick, method, as, danger = false }) {
    const className = ['mf-header-menu__item', active ? 'is-active' : '', danger ? 'is-danger' : '']
        .filter(Boolean)
        .join(' ');

    const content = (
        <>
            {Icon ? (
                <span className="mf-header-menu__item-icon" aria-hidden>
                    <Icon active={Boolean(active)} />
                </span>
            ) : null}
            <span>{label}</span>
        </>
    );

    if (onClick && !href) {
        return (
            <li role="none">
                <button type="button" role="menuitem" className={className} onClick={onClick}>
                    {content}
                </button>
            </li>
        );
    }

    return (
        <li role="none">
            <Link
                href={href}
                method={method}
                as={as}
                role="menuitem"
                className={className}
                aria-current={active ? 'page' : undefined}
                prefetch={method ? undefined : true}
                onClick={onClick}
            >
                {content}
            </Link>
        </li>
    );
}

function SocialHeaderNavMenu({ tabs, isGuest }) {
    const menuId = useId();
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const { rootRef, menuRef } = useDropdownMenu(open, setOpen, triggerRef);

    const close = useCallback(() => setOpen(false), []);

    return (
        <div className="mf-header-menu mf-header-menu--nav" ref={rootRef}>
            <button
                type="button"
                ref={triggerRef}
                className={`mf-header-menu__trigger ${open ? 'is-open' : ''}`}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((value) => !value)}
            >
                <IconMenu />
            </button>

            {open ? (
                <ul
                    id={menuId}
                    ref={menuRef}
                    role="menu"
                    className="mf-header-menu__panel"
                    aria-label="Social destinations"
                >
                    {tabs.map((tab) => (
                        <HeaderMenuItem
                            key={tab.label}
                            href={tab.href}
                            label={tab.label}
                            icon={tab.icon}
                            active={tab.active}
                            onClick={close}
                        />
                    ))}
                    <li role="separator" className="mf-header-menu__sep" aria-hidden="true" />
                    {isGuest ? (
                        <HeaderMenuItem href="/login" label="Sign in" onClick={close} />
                    ) : (
                        <HeaderMenuItem
                            href="/logout"
                            method="post"
                            as="button"
                            label="Sign out"
                            danger
                            onClick={close}
                        />
                    )}
                </ul>
            ) : null}
        </div>
    );
}

function SocialHeaderAccountMenu({ user, handle, profileHref }) {
    const menuId = useId();
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const { rootRef, menuRef } = useDropdownMenu(open, setOpen, triggerRef);
    const close = useCallback(() => setOpen(false), []);
    const initial = (user?.name || handle || '?').slice(0, 1).toUpperCase();

    return (
        <div className="mf-header-menu mf-header-menu--account" ref={rootRef}>
            <button
                type="button"
                ref={triggerRef}
                className={`mf-header-menu__avatar ${open ? 'is-open' : ''}`}
                aria-label={open ? 'Close account menu' : 'Open account menu'}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((value) => !value)}
            >
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="mf-header-menu__avatar-img" />
                ) : (
                    <span className="mf-header-menu__avatar-fallback mf-display">{initial}</span>
                )}
            </button>

            {open ? (
                <ul
                    id={menuId}
                    ref={menuRef}
                    role="menu"
                    className="mf-header-menu__panel mf-header-menu__panel--account"
                    aria-label="Account"
                >
                    <li role="none" className="mf-header-menu__identity">
                        <span className="mf-header-menu__identity-name">{user?.name || 'Fan'}</span>
                        <span className="mf-header-menu__identity-handle mf-mono">@{handle || 'fan'}</span>
                    </li>
                    <li role="separator" className="mf-header-menu__sep" aria-hidden="true" />
                    <HeaderMenuItem href={profileHref} label="You" icon={IconProfile} onClick={close} />
                    <HeaderMenuItem href="/campaign" label="Campaign" icon={IconCampaign} onClick={close} />
                    <HeaderMenuItem
                        href="/logout"
                        method="post"
                        as="button"
                        label="Sign out"
                        danger
                        onClick={close}
                    />
                </ul>
            ) : null}
        </div>
    );
}

/**
 * `mobileBare` keeps the desktop sidebar but drops the mobile header and tab bar,
 * for full-height surfaces (a chat thread) that own their own chrome.
 * `wide` widens the app column so two-pane layouts get room on desktop.
 */
export default function SocialShell({
    children,
    title,
    showTabs = true,
    backHref,
    fillViewport = false,
    mobileBare = false,
    wide = false,
    hideHeaderOnMobile = false,
    hideHeader = false,
}) {
    const page = usePage();
    const { auth, flash, app } = page.props;
    const user = auth?.user;
    const handle = user?.handle || user?.fan_id;
    const current = page.url?.split('?')[0] || '';
    const logoUrl = app?.logo_url || null;

    const profileHref = '/social/you';

    // Seeded from the shared Inertia prop (always fresh server-side, no extra
    // request needed) and kept live via the viewer's private Reverb channel
    // while they stay on a page without navigating.
    const [unreadCount, setUnreadCount] = useState(page.props?.notifications?.unread_count ?? 0);

    useEffect(() => {
        setUnreadCount(page.props?.notifications?.unread_count ?? 0);
    }, [page.props?.notifications?.unread_count]);

    useEffect(() => {
        if (!user?.id) {
            return undefined;
        }

        const echo = getEcho();
        if (!echo) {
            return undefined;
        }

        const name = `social.notifications.${user.id}`;
        const channel = echo.private(name).listen('.notification.created', () => {
            setUnreadCount((prev) => prev + 1);
        });

        return () => {
            channel.stopListening('.notification.created');
            leaveEchoChannel(name);
        };
    }, [user?.id]);

    // Chat has no per-user broadcast channel (messages broadcast per-channel
    // only), so the badge is seeded from the shared prop on every navigation
    // and topped up with a light poll — same "poll is the fallback" idiom the
    // rest of Social chat already uses.
    const [chatUnread, setChatUnread] = useState(page.props?.chat?.unread_count ?? 0);

    useEffect(() => {
        setChatUnread(page.props?.chat?.unread_count ?? 0);
    }, [page.props?.chat?.unread_count]);

    useEffect(() => {
        if (!user?.id) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            socialApi('/chat/unread-count')
                .then((data) => setChatUnread(data?.unread_count ?? 0))
                .catch(() => {});
        }, 30000);

        return () => window.clearInterval(timer);
    }, [user?.id]);

    // "Guest can see it, sign in to do it" — see resources/js/pages/Social/authGate.js.
    const isGuest = !user;
    const [gateAction, setGateAction] = useState(null);
    const closeGate = useCallback(() => setGateAction(null), []);
    const requireAuth = useCallback(
        (action) => {
            if (!isGuest) {
                return true;
            }
            setGateAction(action || true);
            return false;
        },
        [isGuest],
    );
    const authGateApi = useMemo(
        () => ({ isGuest, requireAuth }),
        [isGuest, requireAuth],
    );

    const [composeOpen, setComposeOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [navSkeletonKind, setNavSkeletonKind] = useState(null);
    const navSkeletonTimer = useRef(null);
    const toastId = useRef(0);

    const openCompose = useCallback(() => setComposeOpen(true), []);
    const closeCompose = useCallback(() => setComposeOpen(false), []);

    const pushToast = useCallback((tone, message) => {
        const text = typeof message === 'string' ? message.trim() : '';
        if (!text) {
            return;
        }

        toastId.current += 1;
        const id = toastId.current;
        setToasts((current) => [...current.slice(-4), { id, tone, message: text }]);

        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 4200);
    }, []);

    const reportError = useCallback(
        (message) => {
            pushToast('err', message || 'Action failed — rolled back.');
        },
        [pushToast],
    );
    const reportSuccess = useCallback(
        (message) => {
            pushToast('ok', message || 'Done.');
        },
        [pushToast],
    );
    const clearError = useCallback(() => {}, []);

    const clearNavSkeleton = useCallback(() => {
        if (navSkeletonTimer.current) {
            window.clearTimeout(navSkeletonTimer.current);
            navSkeletonTimer.current = null;
        }
        setNavSkeletonKind(null);
    }, []);

    const composeApi = useMemo(
        () => ({ openCompose, closeCompose, composeOpen }),
        [openCompose, closeCompose, composeOpen],
    );

    const flashApi = useMemo(
        () => ({ reportError, reportSuccess, clearError }),
        [reportError, reportSuccess, clearError],
    );

    const notificationsApi = useMemo(
        () => ({
            decrementUnread: (by = 1) => setUnreadCount((count) => Math.max(0, count - by)),
            setUnread: (count) => setUnreadCount(Math.max(0, count)),
        }),
        [],
    );

    useEffect(() => {
        if (flash?.success) {
            pushToast('ok', flash.success);
        }
        if (flash?.error) {
            pushToast('err', flash.error);
        }
    }, [flash?.success, flash?.error, pushToast]);

    useEffect(() => {
        if (!showTabs) {
            return undefined;
        }

        const params = new URLSearchParams(page.url?.includes('?') ? page.url.split('?')[1] : '');
        if (params.get('compose') === '1') {
            setComposeOpen(true);
        }

        return undefined;
    }, [page.url, showTabs]);

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            const visit = event.detail.visit;
            if (!shouldShowSocialNavSkeleton(visit)) {
                return;
            }

            const kind = resolveSocialSkeletonKind(visitPathname(visit));

            if (navSkeletonTimer.current) {
                window.clearTimeout(navSkeletonTimer.current);
            }

            navSkeletonTimer.current = window.setTimeout(() => {
                setNavSkeletonKind(kind);
            }, NAV_SKELETON_DELAY_MS);
        });

        const removeFinish = router.on('finish', () => {
            clearNavSkeleton();
        });

        return () => {
            removeStart();
            removeFinish();
            clearNavSkeleton();
        };
    }, [clearNavSkeleton]);

    // Primary destinations shown in the mobile bottom tab bar (exactly these
    // five) — for a guest, only Events and Feed are reachable at all (every
    // other Social page now requires an account, see routes/social.php), so
    // the rest have nothing to navigate to and are dropped from the list.
    const primaryTabs = [
        {
            href: '/social',
            label: 'Events',
            icon: IconEvents,
            active: pathMatches(current, '/social', true),
        },
        {
            href: '/social/feed',
            label: 'Feed',
            icon: IconFeed,
            active: pathMatches(current, '/social/feed') || pathMatches(current, '/social/posts'),
        },
        ...(isGuest
            ? []
            : [
                  {
                      href: '/social/fandom',
                      label: 'Fandom',
                      icon: IconFandom,
                      // Fixtures and the League table are fandom-specific pages, so both
                      // live under this one Fandom hub instead of two standalone nav
                      // entries — ticket purchase/wallet is reached from a fixture's own
                      // match detail.
                      active:
                          pathMatches(current, '/social/fandom') ||
                          pathMatches(current, '/social/fixtures') ||
                          pathMatches(current, '/social/clubs') ||
                          pathMatches(current, '/social/tickets'),
                  },
                  {
                      href: '/social/videos',
                      label: 'Short',
                      icon: IconReels,
                      active: pathMatches(current, '/social/videos'),
                  },
                  {
                      href: '/social/chat',
                      label: 'Chat',
                      icon: IconChat,
                      active: pathMatches(current, '/social/chat'),
                      badge: chatUnread,
                  },
              ]),
    ];

    // Secondary destinations: sidebar + header menus only (not bottom tabs).
    // All auth-only pages, so a guest gets none of them — the sidebar's own
    // "You" slot becomes a Sign in prompt instead (see the sidebar render below).
    const secondaryTabs = isGuest
        ? []
        : [
              {
                  href: '/social/shop',
                  label: 'Store',
                  icon: IconShop,
                  active: pathMatches(current, '/social/shop'),
              },
              {
                  href: '/social/stage',
                  label: 'Join stage',
                  icon: IconStage,
                  active: pathMatches(current, '/social/stage'),
              },
              {
                  href: '/social/live',
                  label: 'Live',
                  icon: IconLiveStage,
                  active: pathMatches(current, '/social/live'),
              },
              {
                  href: profileHref,
                  label: 'You',
                  icon: IconProfile,
                  active: pathMatches(current, '/social/you'),
              },
          ];

    const tabs = [...primaryTabs, ...secondaryTabs];
    const mobileTabs = primaryTabs;

    // Third desktop panel: chat lives on the right of every page except Chat
    // itself and other `wide` two-pane pages (Stage room), which span this
    // column with their own right pane. `.mf-shell--wide` then collapses the
    // grid to two tracks and hides the inert gutter.
    const showChatRail = showTabs && !wide && !pathMatches(current, '/social/chat');

    return (
        <AuthGateContext.Provider value={authGateApi}>
        <SocialFlashContext.Provider value={flashApi}>
            <SocialNotificationsContext.Provider value={notificationsApi}>
            <SocialComposeContext.Provider value={composeApi}>
                {/*
                  * The wide flag is mirrored onto .mf-stage because the floating
                  * chrome below (StageChrome, the toast stack) are siblings of the
                  * shell, not descendants — they need an ancestor hook to know the
                  * page column runs all the way to the shell's right edge.
                  */}
                <div className={`mf-stage ${wide ? 'mf-stage--wide' : ''}`.trim()}>
                <div
                    className={[
                        'mf-shell',
                        showTabs ? 'mf-shell--nav' : 'mf-shell--bare',
                        fillViewport ? 'mf-shell--fill' : '',
                        mobileBare ? 'mf-shell--mobile-bare' : '',
                        wide ? 'mf-shell--wide' : '',
                        hideHeaderOnMobile ? 'mf-shell--custom-header' : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                >
                    {showTabs ? (
                        <aside className="mf-sidebar" aria-label="Social navigation">
                            <div className="mf-sidebar__top">
                                <Link
                                    href="/social"
                                    className="mf-sidebar__brand"
                                    aria-label="Mad Fan Social home"
                                    prefetch
                                >
                                    <BrandMark logoUrl={logoUrl} />
                                </Link>

                                <nav className="mf-sidebar__nav">
                                    {tabs.map((tab) => (
                                        <NavItem
                                            key={tab.label}
                                            href={tab.href}
                                            label={tab.label}
                                            icon={tab.icon}
                                            active={tab.active}
                                            badge={tab.badge}
                                        />
                                    ))}
                                </nav>
                            </div>

                            {user ? (
                                <Link
                                    href="/social/you"
                                    className="mf-sidebar__user"
                                    aria-label={`You — ${user.name || handle || 'you'}`}
                                    title="You"
                                    prefetch
                                >
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt=""
                                            className="mf-sidebar__user-avatar"
                                        />
                                    ) : (
                                        <span className="mf-sidebar__user-avatar mf-sidebar__user-avatar--fallback mf-display">
                                            {(user.name || handle || '?').slice(0, 1).toUpperCase()}
                                        </span>
                                    )}
                                    <span className="mf-sidebar__user-meta">
                                        <span className="mf-sidebar__user-name">{user.name || 'Fan'}</span>
                                        <span className="mf-sidebar__user-handle mf-mono">
                                            @{handle || 'fan'}
                                        </span>
                                    </span>
                                    <span className="mf-sidebar__user-stats">
                                        <span className="mf-mono">{user.total_points ?? 0}</span>
                                        <span className="mf-text-caption">pts</span>
                                    </span>
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="mf-sidebar__user mf-sidebar__user--guest"
                                    aria-label="Sign in"
                                    title="Sign in"
                                    prefetch
                                >
                                    <span
                                        className="mf-sidebar__user-avatar mf-sidebar__user-avatar--fallback mf-display"
                                        aria-hidden
                                    >
                                        👤
                                    </span>
                                    <span className="mf-sidebar__user-meta">
                                        <span className="mf-sidebar__user-name">Sign in</span>
                                        <span className="mf-sidebar__user-handle mf-mono">Join Mad Fan</span>
                                    </span>
                                </Link>
                            )}
                        </aside>
                    ) : null}

                    <div className={`mf-app ${fillViewport ? 'mf-app--fill' : ''}`}>
                        {!hideHeader && (title || backHref || showTabs) && (
                            <header className={`mf-header ${fillViewport ? 'mf-header--compact' : ''}`}>
                                {showTabs ? (
                                    <SocialHeaderNavMenu tabs={tabs} isGuest={isGuest} />
                                ) : null}

                                {backHref ? (
                                    <Link
                                        href={backHref}
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--mf-pitch)] transition-colors hover:bg-[var(--mf-elevated)]"
                                        aria-label="Back"
                                    >
                                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" aria-hidden>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6 9 12l6 6" />
                                        </svg>
                                    </Link>
                                ) : null}
                                <div className="min-w-0 flex-1">
                                    {title ? (
                                        <p className="mf-display mf-text-title truncate tracking-[0.03em] text-[var(--mf-text)]">
                                            {title}
                                        </p>
                                    ) : null}
                                </div>
                                {user && !fillViewport ? (
                                    <Link
                                        href="/social/passport"
                                        className="mf-header__passport flex max-w-[7.5rem] flex-col items-end rounded-lg px-1.5 py-1 transition-colors hover:bg-[var(--mf-elevated)]"
                                    >
                                        <span className="mf-mono mf-text-micro truncate text-[var(--mf-pitch)]">
                                            {user.total_points ?? 0} pts
                                        </span>
                                        <span className="mf-text-caption truncate text-[var(--mf-amber)]">
                                            {user.current_streak_days || 0}d
                                        </span>
                                    </Link>
                                ) : null}
                                {showTabs && user ? (
                                    <Link
                                        href="/social/notifications"
                                        className="mf-header__bell"
                                        aria-label={
                                            unreadCount > 0
                                                ? `Notifications, ${unreadCount} unread`
                                                : 'Notifications'
                                        }
                                        title="Notifications"
                                    >
                                        <IconBell />
                                        {unreadCount > 0 ? (
                                            <span className="mf-header__bell-badge mf-mono">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        ) : null}
                                    </Link>
                                ) : null}
                                {showTabs && user ? (
                                    <SocialHeaderAccountMenu
                                        user={user}
                                        handle={handle}
                                        profileHref={profileHref}
                                    />
                                ) : null}
                            </header>
                        )}

                        <main
                            className={[
                                'mf-main',
                                fillViewport ? 'mf-main--fill' : '',
                                // Full-bleed pages (Live's Studio/Reels/Go Live) manage their own
                                // edge-to-edge layout and safe-area insets — this bottom padding
                                // is for the ordinary custom-header pages that still need one.
                                !showTabs && !fillViewport ? 'pb-[max(1rem,var(--mf-safe-bottom))]' : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                        >
                            {navSkeletonKind ? <SocialPageSkeleton kind={navSkeletonKind} /> : children}
                        </main>

                        {showTabs ? (
                            <nav className="mf-tabbar" aria-label="Primary">
                                {mobileTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const className = ['mf-tab', tab.active ? 'is-active' : '']
                                        .filter(Boolean)
                                        .join(' ');

                                    return (
                                        <Link
                                            key={tab.label}
                                            href={tab.href}
                                            className={className}
                                            aria-current={tab.active ? 'page' : undefined}
                                            aria-label={tab.badge ? `${tab.label}, ${tab.badge} unread` : undefined}
                                            prefetch
                                        >
                                            <span className="mf-tab__icon">
                                                <Icon active={tab.active} />
                                                <NavBadge count={tab.badge} />
                                            </span>
                                            {tab.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        ) : null}
                    </div>

                    {showTabs ? (
                        showChatRail ? (
                            <ChatRail />
                        ) : (
                            <div className="mf-gutter" aria-hidden="true" />
                        )
                    ) : null}
                </div>

                {showTabs ? (
                    <ComposeSheet
                        open={composeOpen}
                        onClose={closeCompose}
                        maxBodyLength={280}
                        maxImages={4}
                    />
                ) : null}

                <StageChrome />

                <SignInGate action={gateAction} onClose={closeGate} />

                <div className="mf-toast-stack" aria-live="polite" aria-relevant="additions">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`mf-toast mf-toast--${toast.tone}`}
                            role={toast.tone === 'err' ? 'alert' : 'status'}
                        >
                            <span className="mf-toast__mark" aria-hidden />
                            <p className="mf-toast__copy">{toast.message}</p>
                            <button
                                type="button"
                                className="mf-toast__dismiss"
                                aria-label="Dismiss"
                                onClick={() =>
                                    setToasts((current) => current.filter((item) => item.id !== toast.id))
                                }
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            </SocialComposeContext.Provider>
            </SocialNotificationsContext.Provider>
        </SocialFlashContext.Provider>
        </AuthGateContext.Provider>
    );
}
