import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    ActivityIcon,
    AwardIcon,
    BarChart3Icon,
    CalendarDaysIcon,
    CalendarRangeIcon,
    ClipboardCheckIcon,
    ClipboardListIcon,
    CoinsIcon,
    CommandIcon,
    ExternalLinkIcon,
    HashIcon,
    ImageIcon,
    KeyRoundIcon,
    LayoutDashboardIcon,
    MessageSquareIcon,
    MicIcon,
    PlayCircleIcon,
    RadioIcon,
    Settings2Icon,
    ShieldAlertIcon,
    ShieldIcon,
    ShirtIcon,
    ShoppingBagIcon,
    TargetIcon,
    TerminalIcon,
    TrophyIcon,
    UserCogIcon,
    UsersIcon,
    VoteIcon,
    WalletIcon,
} from 'lucide-react';
import { NavDocuments } from '@/Components/nav-documents';
import { NavMain } from '@/Components/nav-main';
import { NavSecondary } from '@/Components/nav-secondary';
import { NavUser } from '@/Components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/Components/ui/sidebar';
import { adminPath } from '@/lib/adminPath';
import {
    buildAdminNavigation,
    filterAndPrioritizeNav,
    groupNavigationBySection,
} from '@/admin/roleWorkspaces';

const NAV_ICONS = {
    dashboard: LayoutDashboardIcon,
    leaderboard: TrophyIcon,
    live: RadioIcon,
    me: AwardIcon,
    showdowns: TargetIcon,
    users: UsersIcon,
    staff: ShieldIcon,
    admins: UserCogIcon,
    roles: KeyRoundIcon,
    fandoms: RadioIcon,
    leagues: TrophyIcon,
    clubs: CommandIcon,
    posts: MessageSquareIcon,
    announcements: CalendarDaysIcon,
    fixtures: BarChart3Icon,
    reports: ShieldAlertIcon,
    polls: VoteIcon,
    predictions: TargetIcon,
    stages: MicIcon,
    channels: HashIcon,
    highlights: PlayCircleIcon,
    tasks: ClipboardListIcon,
    'task-reviews': ClipboardCheckIcon,
    seasons: CalendarRangeIcon,
    'loyalty-tiers': AwardIcon,
    jerseys: ShirtIcon,
    media: ImageIcon,
    'jersey-orders': ShoppingBagIcon,
    referrals: WalletIcon,
    'point-transactions': CoinsIcon,
    'activity-logs': ActivityIcon,
    settings: Settings2Icon,
    'system-logs': TerminalIcon,
};

function withIcon(item) {
    const Icon = NAV_ICONS[item.key] ?? LayoutDashboardIcon;

    return {
        ...item,
        icon: <Icon className="size-4" />,
    };
}

function toNavMainItem(item) {
    return {
        title: item.name,
        url: item.href,
        icon: item.icon,
        external: item.external ?? false,
    };
}

function toNavDocumentItem(item) {
    return {
        name: item.name,
        url: item.href,
        icon: item.icon,
        external: item.external ?? false,
    };
}

export function AppSidebar({ ...props }) {
    const page = usePage();
    const { auth, workspace, adminOrganization } = page.props;
    const { url: currentPath } = page;
    const permissions = auth?.user?.permissions ?? [];
    const base = adminPath(page.props);

    const { navMainItems, navDocumentGroups, navSecondaryItems } = useMemo(() => {
        const items = filterAndPrioritizeNav(
            buildAdminNavigation(base).map(withIcon),
            permissions,
            workspace?.focus ?? [],
        );

        const grouped = groupNavigationBySection(items);
        const overview = grouped.find((group) => group.section === 'overview');
        const system = grouped.find((group) => group.section === 'system');

        const secondary = (system?.items ?? []).map(toNavMainItem);

        if (adminOrganization?.filament_url) {
            secondary.push({
                title: 'Filament console',
                url: adminOrganization.filament_url,
                icon: <ExternalLinkIcon className="size-4" />,
                external: true,
            });
        }

        return {
            navMainItems: (overview?.items ?? []).map(toNavMainItem),
            navDocumentGroups: grouped
                .filter((group) => group.section !== 'overview' && group.section !== 'system')
                .map((group) => ({
                    label: group.label,
                    items: group.items.map(toNavDocumentItem),
                })),
            navSecondaryItems: secondary,
        };
    }, [adminOrganization?.filament_url, base, permissions, workspace?.focus]);

    function isActive(href) {
        if (href === base || href === `${base}/`) {
            return currentPath === base || currentPath === `${base}/`;
        }

        return currentPath === href || currentPath.startsWith(`${href}/`);
    }

    const user = {
        name: auth?.user?.name ?? 'Admin',
        email: auth?.user?.email ?? '',
        avatar: auth?.user?.avatar_url ?? null,
        roles: auth?.user?.roles?.join(', ') ?? '',
    };

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[slot=sidebar-menu-button]:p-1.5!"
                            render={<Link href={base === '' ? '/' : base} prefetch />}
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <CommandIcon className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {workspace?.label ?? 'Mad Fan Ops'}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {workspace?.tagline ?? 'Operations console'}
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMainItems} isActive={isActive} showQuickCreate={false} />
                {navDocumentGroups.map((group) => (
                    <NavDocuments
                        key={group.label}
                        label={group.label}
                        items={group.items}
                        showActions={false}
                        isActive={isActive}
                    />
                ))}
                <NavSecondary items={navSecondaryItems} className="mt-auto" isActive={isActive} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser
                    user={user}
                    profileHref={adminPath(page.props, 'profile')}
                    logoutHref={adminPath(page.props, 'logout')}
                />
            </SidebarFooter>
        </Sidebar>
    );
}
