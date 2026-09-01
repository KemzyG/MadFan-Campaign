import { adminPath } from '../lib/adminPath';

/** @typedef {'overview' | 'people' | 'social' | 'campaigns' | 'growth' | 'system'} NavSection */

/** @type {Record<NavSection, string>} */
export const NAV_SECTION_LABELS = {
    overview: 'Overview',
    people: 'People & access',
    social: 'Social',
    campaigns: 'Campaigns & rewards',
    growth: 'Growth & finance',
    system: 'System',
};

/** @type {NavSection[]} */
export const NAV_SECTION_ORDER = ['overview', 'people', 'social', 'campaigns', 'growth', 'system'];

/**
 * Role-aware navigation for the Inertia ops console only (/ops or ADMIN_DOMAIN).
 * Filament (/admin) has its own navigation — do not wire new ops items there.
 *
 * @param {string} basePath e.g. "/ops"
 */
export function buildAdminNavigation(basePath = '/ops') {
    const p = (suffix) => adminPath({ app: { admin_path: basePath } }, suffix);

    return [
        { name: 'Dashboard', href: p(''), permission: 'dashboard.view', key: 'dashboard', section: 'overview' },
        { name: 'Leaderboard', href: p('leaderboard'), permission: 'dashboard.view', key: 'leaderboard', section: 'overview' },
        { name: 'Live ops', href: p('live'), permission: 'dashboard.view', key: 'live', section: 'overview' },
        { name: 'My desk', href: p('me'), permission: 'dashboard.view', key: 'me', section: 'overview' },
        { name: 'Users', href: p('users'), permission: 'users.view', key: 'users', section: 'people' },
        { name: 'Staff', href: p('staff'), permission: 'staff.view', key: 'staff', section: 'people' },
        { name: 'Admins', href: p('admins'), permission: 'admins.view', key: 'admins', section: 'people' },
        { name: 'Roles', href: p('roles'), permission: 'roles.view', key: 'roles', section: 'people' },
        { name: 'Fandoms', href: p('fandoms'), permission: 'fandoms.manage', key: 'fandoms', section: 'social' },
        { name: 'Leagues', href: p('leagues'), permission: 'leagues.manage', key: 'leagues', section: 'social' },
        { name: 'Clubs', href: p('clubs'), permission: 'clubs.manage', key: 'clubs', section: 'social' },
        { name: 'Posts', href: p('posts'), permission: 'posts.manage', key: 'posts', section: 'social' },
        { name: 'Events', href: p('announcements'), permission: 'announcements.manage', key: 'announcements', section: 'social' },
        { name: 'Fixtures', href: p('fixtures'), permission: 'fixtures.manage', key: 'fixtures', section: 'social' },
        { name: 'Reports', href: p('reports'), permission: 'reports.manage', key: 'reports', section: 'social' },
        { name: 'Vote', href: p('polls'), permission: 'polls.manage', key: 'polls', section: 'social' },
        { name: 'Showdowns', href: p('showdowns'), permission: 'polls.manage', key: 'showdowns', section: 'social' },
        { name: 'Predictions', href: p('predictions'), permission: 'predictions.manage', key: 'predictions', section: 'social' },
        { name: 'Stages', href: p('stages'), permission: 'stages.manage', key: 'stages', section: 'social' },
        { name: 'Channels', href: p('channels'), permission: 'channels.manage', key: 'channels', section: 'social' },
        { name: 'Highlights', href: p('highlights'), permission: 'highlights.manage', key: 'highlights', section: 'social' },
        { name: 'Tasks', href: p('tasks'), permission: 'tasks.manage', key: 'tasks', section: 'campaigns' },
        { name: 'Task reviews', href: p('task-reviews'), permission: 'users.view', key: 'task-reviews', section: 'campaigns' },
        { name: 'Seasons', href: p('seasons'), permission: 'seasons.manage', key: 'seasons', section: 'campaigns' },
        { name: 'Loyalty Tiers', href: p('loyalty-tiers'), permission: 'loyalty-tiers.manage', key: 'loyalty-tiers', section: 'campaigns' },
        { name: 'Jerseys', href: p('jerseys'), permission: 'jerseys.manage', key: 'jerseys', section: 'campaigns' },
        { name: 'Media gallery', href: p('media'), permission: 'media.manage', key: 'media', section: 'campaigns' },
        { name: 'Jersey orders', href: p('jersey-orders'), permission: 'jersey-orders.view', key: 'jersey-orders', section: 'campaigns' },
        { name: 'Referrals', href: p('referrals'), permission: 'referrals.view', key: 'referrals', section: 'growth' },
        { name: 'Point Transactions', href: p('point-transactions'), permission: 'point-transactions.view', key: 'point-transactions', section: 'growth' },
        { name: 'Activity Logs', href: p('activity-logs'), permission: 'activity-logs.view', key: 'activity-logs', section: 'system' },
        { name: 'Settings', href: p('settings'), permission: 'settings.view', key: 'settings', section: 'system' },
        { name: 'System Logs', href: p('system-logs'), permission: 'system-logs.view', key: 'system-logs', section: 'system' },
    ];
}

/**
 * @param {Array<{ key?: string, permission: string, section?: NavSection }>} navigation
 * @param {string[]} permissions
 * @param {string[]} [focusKeys]
 */
export function filterAndPrioritizeNav(navigation, permissions, focusKeys = []) {
    const allowed = navigation.filter((item) => permissions.includes(item.permission));
    if (!focusKeys.length) {
        return allowed;
    }

    const rank = new Map(focusKeys.map((key, index) => [key, index]));

    return [...allowed].sort((a, b) => {
        const ra = rank.has(a.key) ? rank.get(a.key) : 1000;
        const rb = rank.has(b.key) ? rank.get(b.key) : 1000;
        if (ra !== rb) {
            return ra - rb;
        }

        return 0;
    });
}

/**
 * @param {Array<{ section?: NavSection }>} items
 * @returns {Array<{ section: NavSection, label: string, items: typeof items }>}
 */
export function groupNavigationBySection(items) {
    /** @type {Map<NavSection, typeof items>} */
    const grouped = new Map();

    for (const item of items) {
        const section = item.section ?? 'overview';
        if (!grouped.has(section)) {
            grouped.set(section, []);
        }
        grouped.get(section).push(item);
    }

    return NAV_SECTION_ORDER.filter((section) => grouped.has(section)).map((section) => ({
        section,
        label: NAV_SECTION_LABELS[section],
        items: grouped.get(section),
    }));
}

export const WORKSPACE_ACCENTS = {
    violet: {
        ring: 'ring-violet-500/30',
        bg: 'bg-violet-500/15',
        text: 'text-violet-300',
        bar: 'from-violet-400 to-fuchsia-500',
        soft: 'bg-violet-500/10',
    },
    brand: {
        ring: 'ring-brand-500/30',
        bg: 'bg-brand-500/15',
        text: 'text-brand-300',
        bar: 'from-brand-400 to-brand-600',
        soft: 'bg-brand-500/10',
    },
    amber: {
        ring: 'ring-brand-500/30',
        bg: 'bg-brand-500/15',
        text: 'text-brand-300',
        bar: 'from-brand-400 to-brand-600',
        soft: 'bg-brand-500/10',
    },
    sky: {
        ring: 'ring-sky-500/30',
        bg: 'bg-sky-500/15',
        text: 'text-sky-300',
        bar: 'from-sky-400 to-cyan-500',
        soft: 'bg-sky-500/10',
    },
};
