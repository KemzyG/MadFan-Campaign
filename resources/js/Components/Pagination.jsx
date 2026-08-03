import { Link } from '@inertiajs/react';

function paginationLabel(label) {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace(/<[^>]*>/g, '')
        .trim();
}

export default function Pagination({ links, meta }) {
    if (!links || links.length <= 3) return null;

    return (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
                {meta?.from ?? 0}–{meta?.to ?? 0} of {meta?.total ?? 0}
            </p>
            <div className="flex flex-wrap gap-1">
                {links.map((link, index) => (
                    <Link
                        key={index}
                        href={link.url ?? '#'}
                        preserveScroll
                        className={`rounded-lg px-3 py-1.5 text-xs ${
                            link.active
                                ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30'
                                : link.url
                                  ? 'bg-white/5 text-zinc-300 hover:bg-white/10'
                                  : 'cursor-not-allowed text-zinc-600'
                        }`}
                    >
                        {paginationLabel(link.label)}
                    </Link>
                ))}
            </div>
        </div>
    );
}
