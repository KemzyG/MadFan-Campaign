import { router, usePage } from '@inertiajs/react';
import { Separator } from '@/Components/ui/separator';
import { SidebarTrigger } from '@/Components/ui/sidebar';
import { adminPath } from '@/lib/adminPath';

export function SiteHeader({ title = 'Ops' }) {
    const page = usePage();
    const { adminOrganization } = page.props;

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
                <h1 className="min-w-0 flex-1 truncate text-base font-medium">{title}</h1>
                <div className="flex items-center gap-2">
                    {adminOrganization?.available?.length > 0 && (
                        <select
                            className="hidden rounded-md border border-input bg-background px-2 py-1.5 text-xs sm:block"
                            value={adminOrganization.current?.id ?? ''}
                            onChange={(event) => {
                                const value = event.target.value;
                                router.post(adminPath(page.props, 'organization'), {
                                    organization_id: value === '' ? null : Number(value),
                                });
                            }}
                        >
                            {adminOrganization.is_super_admin && <option value="">All organizations</option>}
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
                            target="_blank"
                            rel="noreferrer"
                            className="hidden rounded-md border px-3 py-1.5 text-xs font-medium sm:inline-block"
                        >
                            Filament
                        </a>
                    )}
                </div>
            </div>
        </header>
    );
}
