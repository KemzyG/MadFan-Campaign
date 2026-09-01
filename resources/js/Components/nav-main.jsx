import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/Components/ui/sidebar';
import { CirclePlusIcon, MailIcon } from 'lucide-react';

export function NavMain({ items, isActive, showQuickCreate = true }) {
    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                {showQuickCreate ? (
                    <SidebarMenu>
                        <SidebarMenuItem className="flex items-center gap-2">
                            <SidebarMenuButton
                                tooltip="Quick Create"
                                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                            >
                                <CirclePlusIcon />
                                <span>Quick Create</span>
                            </SidebarMenuButton>
                            <Button
                                size="icon"
                                className="size-8 group-data-[collapsible=icon]:opacity-0"
                                variant="outline"
                            >
                                <MailIcon />
                                <span className="sr-only">Inbox</span>
                            </Button>
                        </SidebarMenuItem>
                    </SidebarMenu>
                ) : null}
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.url}>
                            <SidebarMenuButton
                                tooltip={item.title}
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
                                <span>{item.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
