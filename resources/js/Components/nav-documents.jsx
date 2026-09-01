import { Link } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { FolderIcon, MoreHorizontalIcon, ShareIcon, Trash2Icon } from 'lucide-react';

export function NavDocuments({
    items,
    label = 'Documents',
    showActions = true,
    isActive,
}) {
    const { isMobile } = useSidebar();

    if (!items.length) {
        return null;
    }

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.url ?? item.name}>
                        <SidebarMenuButton
                            tooltip={item.name}
                            isActive={isActive?.(item.url) ?? false}
                            render={
                                item.external ? (
                                    <a href={item.url} target="_blank" rel="noreferrer" />
                                ) : (
                                    <Link href={item.url} prefetch />
                                )
                            }
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </SidebarMenuButton>
                        {showActions ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <SidebarMenuAction
                                            showOnHover
                                            className="aria-expanded:bg-muted"
                                        />
                                    }
                                >
                                    <MoreHorizontalIcon />
                                    <span className="sr-only">More</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-24"
                                    side={isMobile ? 'bottom' : 'right'}
                                    align={isMobile ? 'end' : 'start'}
                                >
                                    <DropdownMenuItem>
                                        <FolderIcon />
                                        <span>Open</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <ShareIcon />
                                        <span>Share</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive">
                                        <Trash2Icon />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </SidebarMenuItem>
                ))}
                {showActions ? (
                    <SidebarMenuItem>
                        <SidebarMenuButton className="text-sidebar-foreground/70">
                            <MoreHorizontalIcon className="text-sidebar-foreground/70" />
                            <span>More</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ) : null}
            </SidebarMenu>
        </SidebarGroup>
    );
}
