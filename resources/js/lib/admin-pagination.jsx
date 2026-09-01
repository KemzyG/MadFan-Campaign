import { Link } from '@inertiajs/react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from '@/components/ui/pagination';

function paginationLabel(label) {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace(/<[^>]*>/g, '')
        .trim();
}

export function AdminPagination({ links, meta }) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                {meta?.from ?? 0}–{meta?.to ?? 0} of {meta?.total ?? 0}
            </p>
            <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                    {links.map((link, index) => (
                        <PaginationItem key={index}>
                            {link.url ? (
                                <PaginationLink
                                    isActive={link.active}
                                    render={<Link href={link.url} preserveScroll />}
                                >
                                    {paginationLabel(link.label)}
                                </PaginationLink>
                            ) : (
                                <PaginationLink isActive={false} className="pointer-events-none opacity-50">
                                    {paginationLabel(link.label)}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}
                </PaginationContent>
            </Pagination>
        </div>
    );
}
