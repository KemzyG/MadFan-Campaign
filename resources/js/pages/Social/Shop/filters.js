import { router } from '@inertiajs/react';

/**
 * Category metadata + filter helpers for the store. Kept framework-light so both
 * the rail (ShopFilters) and the page entry (Index) can share the same logic.
 */
export const CATEGORY_SEGMENTS = {
    kit: { abbr: 'K', aria: 'Kits' },
    boots: { abbr: 'B', aria: 'Boots' },
    training: { abbr: 'TR', aria: 'Training' },
    socks: { abbr: 'S', aria: 'Socks' },
    caps: { abbr: 'C', aria: 'Caps' },
    nft: { abbr: 'NFT', aria: 'Collectible cards' },
    streaming: { abbr: 'ST', aria: 'Streaming' },
    gaming: { abbr: 'GC', aria: 'Gaming credits' },
    music: { abbr: 'M', aria: 'Music' },
};

export function categoryAbbr(slug) {
    return CATEGORY_SEGMENTS[slug]?.abbr ?? slug.slice(0, 2).toUpperCase();
}

export function categoryAria(category) {
    const hint = CATEGORY_SEGMENTS[category.slug];

    return hint
        ? `${hint.aria}, ${category.count} items`
        : `${category.label}, ${category.count} items`;
}

export function updateFilters(filters, patch) {
    const next = {
        type: filters.type || undefined,
        fandom_id: filters.fandom_id || undefined,
        club_id: filters.club_id || undefined,
        league_id: filters.league_id || undefined,
        category: filters.category || undefined,
        sort: filters.sort && filters.sort !== 'name' ? filters.sort : undefined,
        in_stock: filters.in_stock ? 1 : undefined,
        ...patch,
    };

    Object.keys(next).forEach((key) => {
        if (next[key] === undefined || next[key] === null || next[key] === '') {
            delete next[key];
        }
    });

    router.get('/social/shop', next, {
        preserveState: true,
        replace: true,
        preserveScroll: true,
    });
}

export function toggleFilter(filters, key, value) {
    updateFilters(filters, {
        [key]: String(filters[key] ?? '') === String(value) ? undefined : value,
    });
}

export function hasActiveFilters(filters) {
    return Boolean(
        filters.type ||
            filters.fandom_id ||
            filters.club_id ||
            filters.league_id ||
            filters.category ||
            filters.in_stock ||
            (filters.sort && filters.sort !== 'name'),
    );
}
