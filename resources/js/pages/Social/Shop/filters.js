import { router } from '@inertiajs/react';

/**
 * Category metadata + filter helpers for the store. Kept framework-light so both
 * the rail (ShopFilters) and the page entry (Index) can share the same logic.
 */
export const CATEGORY_SEGMENTS = {
    home: { abbr: 'H', aria: 'Home kits' },
    away: { abbr: 'A', aria: 'Away kits' },
    third: { abbr: '3', aria: 'Third kits' },
    training: { abbr: 'TR', aria: 'Training kits' },
    terrace: { abbr: 'T', aria: 'Terrace tees' },
};

export function categoryAbbr(slug) {
    return CATEGORY_SEGMENTS[slug]?.abbr ?? slug.slice(0, 2).toUpperCase();
}

export function categoryAria(category) {
    const hint = CATEGORY_SEGMENTS[category.slug];

    return hint
        ? `${hint.aria}, ${category.count} kits`
        : `${category.label}, ${category.count} kits`;
}

export function updateFilters(filters, patch) {
    const next = {
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
        filters.club_id ||
            filters.league_id ||
            filters.category ||
            filters.in_stock ||
            (filters.sort && filters.sort !== 'name'),
    );
}
