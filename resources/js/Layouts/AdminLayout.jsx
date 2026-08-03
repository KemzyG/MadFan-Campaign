import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import FlashMessage from '../Components/FlashMessage';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import { adminPath } from '../lib/adminPath';
import {
    WORKSPACE_ACCENTS,
    buildAdminNavigation,
    filterAndPrioritizeNav,
} from '../admin/roleWorkspaces';

export default function AdminLayout({ children, title }) {
    const page = usePage();
    const { auth, workspace, adminOrganization } = page.props;
    const { url: currentPath } = page;
    const permissions = auth?.user?.permissions ?? [];
    const base = adminPath(page.props);
    const [navOpen, setNavOpen] = useState(false);

    const accent = WORKSPACE_ACCENTS[workspace?.accent] ?? WORKSPACE_ACCENTS.brand;

    const visibleNavigation = useMemo(() => {
        const items = buildAdminNavigation(base);
        return filterAndPrioritizeNav(items, permissions, workspace?.focus ?? []);
    }, [base, permissions, workspace?.focus]);

    useEffect(() => {
        document.title = title ? `${title} · Mad Fan Admin` : 'Mad Fan Admin';
    }, [title]);

    useEffect(() => {
        setNavOpen(false);
    }, [currentPath]);

    function isActive(href) {
        if (href === base || href === `${base}/`) {
            return currentPath === base || currentPath === `${base}/`;
        }

        return currentPath.startsWith(href);
    }

    const nav = (
        <nav className="space-y-1 p-4">
            {visibleNavigation.map((item) => {
                const active = isActive(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                            active
                                ? `${accent.bg} ${accent.text} ring-1 ${accent.ring}`
                                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                    >
                        <span className="text-base opacity-80">{item.icon}</span>
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className={`min-h-screen bg-surface-900 admin-workspace admin-workspace--${workspace?.key ?? 'operator'}`}>
            <ImpersonationBanner />
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className={`absolute -left-32 top-0 h-96 w-96 rounded-full blur-3xl ${accent.soft}`} />
                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
            </div>

            <div className="relative flex min-h-screen">
                <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-surface-800/80 backdrop-blur-xl lg:block">
                    <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
                        <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${accent.bar} text-sm font-bold text-surface-900`}
                        >
                            MF
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{workspace?.label ?? 'Mad Fan'}</p>
                            <p className="text-xs text-zinc-500">{workspace?.tagline ?? 'Admin Console'}</p>
                        </div>
                    </div>
                    {nav}
                </aside>

                {navOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/60"
                            aria-label="Close menu"
                            onClick={() => setNavOpen(false)}
                        />
                        <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/5 bg-surface-800 shadow-xl">
                            <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
                                <p className="text-sm font-semibold text-white">{workspace?.label}</p>
                                <button type="button" className="text-zinc-400" onClick={() => setNavOpen(false)}>
                                    ✕
                                </button>
                            </div>
                            {nav}
                        </aside>
                    </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
                        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-zinc-300 lg:hidden"
                                    onClick={() => setNavOpen(true)}
                                >
                                    Menu
                                </button>
                                <div className="min-w-0">
                                    <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
                                    <p className="truncate text-xs text-zinc-500">{workspace?.job}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {adminOrganization?.available?.length > 0 && (
                                    <select
                                        className="hidden rounded-lg border border-white/10 bg-surface-800 px-2 py-1.5 text-xs text-zinc-200 sm:block"
                                        value={adminOrganization.current?.id ?? ''}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            router.post(adminPath(page.props, 'organization'), {
                                                organization_id: value === '' ? null : Number(value),
                                            });
                                        }}
                                    >
                                        {adminOrganization.is_super_admin && (
                                            <option value="">All organizations</option>
                                        )}
                                        {adminOrganization.available.map((org) => (
                                            <option key={org.id} value={org.id}>
                                                {org.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {adminOrganization?.filament_url && (
                                    <a
                                        href={adminOrganization.filament_url}
                                        className="hidden rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 transition hover:bg-violet-500/20 sm:inline-block"
                                    >
                                        Filament
                                    </a>
                                )}
                                <Link
                                    href={adminPath(page.props, 'profile')}
                                    className="hidden text-right sm:block"
                                >
                                    <p className="text-sm font-medium text-zinc-200">{auth?.user?.name}</p>
                                    <p className="text-xs text-zinc-500">{auth?.user?.roles?.join(', ')}</p>
                                </Link>
                                <Link
                                    href={adminPath(page.props, 'profile')}
                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                                >
                                    Profile
                                </Link>
                                <Link
                                    href={adminPath(page.props, 'logout')}
                                    method="post"
                                    as="button"
                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                                >
                                    Sign out
                                </Link>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-4 sm:p-8">
                        <FlashMessage />
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
