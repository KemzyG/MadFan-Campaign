import { useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import FlashMessage from '../Components/FlashMessage';
import ImpersonationBanner from '../Components/ImpersonationBanner';

export default function AdminLayout({ children, title }) {
    useEffect(() => {
        document.title = title ? `${title} · Mad Fan Ops` : 'Mad Fan Ops';
    }, [title]);

    return (
        <TooltipProvider>
            <ImpersonationBanner />
            <SidebarProvider
                style={{
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                }}
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader title={title ?? 'Ops'} />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
                                <FlashMessage />
                                {children}
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
