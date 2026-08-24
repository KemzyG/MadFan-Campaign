import { Link } from '@inertiajs/react';
import { EVENT_ICONS } from './icons';

/**
 * Type chips above the events stream. Counts come from the unfiltered pass, so
 * "All" always shows the full tally and each chip shows what switching to it
 * would give you.
 *
 * @param {{ filters: Array<{type: string, label: string, count: number}>, active: string|null }} props
 */
export default function EventFilters({ filters = [], active = null }) {
    if (!filters.length) {
        return null;
    }

    const total = filters.reduce((sum, filter) => sum + (filter.count || 0), 0);

    return (
        <div className="mf-ev-filters" role="tablist" aria-label="Event types">
            <Link
                href="/social"
                role="tab"
                aria-selected={!active}
                className={`mf-ev-filter${!active ? ' is-active' : ''}`}
                preserveScroll
                prefetch
            >
                All
                <span className="mf-ev-filter__count">{total}</span>
            </Link>

            {filters.map((filter) => {
                const Icon = EVENT_ICONS[filter.type];
                const isActive = active === filter.type;

                return (
                    <Link
                        key={filter.type}
                        href={`/social?type=${filter.type}`}
                        role="tab"
                        aria-selected={isActive}
                        className={`mf-ev-filter mf-ev-filter--${filter.type}${isActive ? ' is-active' : ''}`}
                        preserveScroll
                        prefetch
                    >
                        {Icon ? <Icon /> : null}
                        {filter.label}
                        <span className="mf-ev-filter__count">{filter.count}</span>
                    </Link>
                );
            })}
        </div>
    );
}
