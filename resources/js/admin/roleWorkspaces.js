import { adminPath } from '../lib/adminPath';

/**
 * Role-aware navigation for the Inertia admin console.
 * Items are filtered by Spatie permissions; ordering prefers workspace.focus.
 *
 * @param {string} basePath e.g. "/app"
 */
export function buildAdminNavigation(basePath = '/app') {
    const p = (suffix) => adminPath({ app: { admin_path: basePath } }, suffix);

    return [
        { name: 'Dashboard', href: p(''), icon: '◈', permission: 'dashboard.view', key: 'dashboard' },
        { name: 'Users', href: p('users'), icon: '◎', permission: 'users.view', key: 'users' },
        { name: 'Staff', href: p('staff'), icon: '⬡', permission: 'staff.view', key: 'staff' },
        { name: 'Tasks', href: p('tasks'), icon: '✦', permission: 'tasks.manage', key: 'tasks' },
        { name: 'Task reviews', href: p('task-reviews'), icon: '⚑', permission: 'users.view', key: 'task-reviews' },
        { name: 'Seasons', href: p('seasons'), icon: '◐', permission: 'seasons.manage', key: 'seasons' },
        { name: 'Loyalty Tiers', href: p('loyalty-tiers'), icon: '★', permission: 'loyalty-tiers.manage', key: 'loyalty-tiers' },
        { name: 'Leagues', href: p('leagues'), icon: '▣', permission: 'leagues.manage', key: 'leagues' },
        { name: 'Clubs', href: p('clubs'), icon: '⌂', permission: 'clubs.manage', key: 'clubs' },
        { name: 'Jerseys', href: p('jerseys'), icon: '⊞', permission: 'jerseys.manage', key: 'jerseys' },
        { name: 'Jersey orders', href: p('jersey-orders'), icon: '▤', permission: 'jersey-orders.view', key: 'jersey-orders' },
        { name: 'Referrals', href: p('referrals'), icon: '↗', permission: 'referrals.view', key: 'referrals' },
        { name: 'Point Transactions', href: p('point-transactions'), icon: '◆', permission: 'point-transactions.view', key: 'point-transactions' },
        { name: 'Activity Logs', href: p('activity-logs'), icon: '☰', permission: 'activity-logs.view', key: 'activity-logs' },
        { name: 'Settings', href: p('settings'), icon: '⚙', permission: 'settings.view', key: 'settings' },
        { name: 'System Logs', href: p('system-logs'), icon: '⚠', permission: 'system-logs.view', key: 'system-logs' },
    ];
}

/**
 * @param {Array<{ key?: string, permission: string }>} navigation
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
