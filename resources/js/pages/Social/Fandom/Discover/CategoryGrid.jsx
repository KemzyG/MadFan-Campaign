import { Link } from '@inertiajs/react';

/**
 * "Explore by Category" — every fandom in the active group as a compact
 * tile, with how many subsets (leagues, games, genres, ...) sit under it.
 */
export default function CategoryGrid({ categories }) {
    if (categories.length === 0) {
        return null;
    }

    return (
        <section className="mf-fd-section">
            <h2 className="mf-fd-section__title">Explore by Category</h2>
            <div className="mf-fd-grid">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/social/fandom/${category.slug}`}
                        className="mf-fd-tile"
                    >
                        <span className="mf-fd-tile__icon" aria-hidden>
                            {category.icon}
                        </span>
                        <span className="min-w-0">
                            <span className="mf-fd-tile__name truncate">{category.name}</span>
                            <span className="mf-fd-tile__count mf-mono">
                                {category.subset_count} {category.subset_count === 1 ? 'fandom' : 'fandoms'}
                            </span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
