import ShopCrest from './ShopCrest';
import { productTypeLabel } from './productMeta';
import {
    categoryAbbr,
    categoryAria,
    toggleFilter,
    updateFilters,
} from './filters';

function TypeSegment({ types, activeType, onSelect }) {
    if (types.length === 0) {
        return null;
    }

    return (
        <div className="mf-shop-type-segment mf-segment" role="tablist" aria-label="Product type">
            <button
                type="button"
                role="tab"
                aria-selected={!activeType}
                className={!activeType ? 'is-active' : ''}
                onClick={() => onSelect(undefined)}
            >
                Everything
            </button>
            {types.map((type) => (
                <button
                    key={type.value}
                    type="button"
                    role="tab"
                    aria-selected={activeType === type.value}
                    className={activeType === type.value ? 'is-active' : ''}
                    onClick={() => onSelect(type.value)}
                >
                    {type.label}
                </button>
            ))}
        </div>
    );
}

function CategorySegment({ categories, activeCategory, onSelect }) {
    return (
        <div className="mf-shop-category-segment mf-segment" role="tablist" aria-label="Category">
            <button
                type="button"
                role="tab"
                aria-selected={!activeCategory}
                className={!activeCategory ? 'is-active' : ''}
                onClick={() => onSelect(undefined)}
            >
                All
            </button>
            {categories.map((category) => (
                <button
                    key={category.slug}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === category.slug}
                    aria-label={categoryAria(category)}
                    className={[
                        activeCategory === category.slug ? 'is-active' : '',
                        `mf-shop-segment--${category.slug}`,
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    onClick={() => onSelect(category.slug)}
                >
                    <span className="mf-shop-segment__mark mf-mono" aria-hidden>
                        {categoryAbbr(category.slug)}
                    </span>
                </button>
            ))}
        </div>
    );
}

function BrowseChips({ label, children }) {
    return (
        <div className="mf-shop-browse">
            <p className="mf-shop-browse__label mf-text-caption text-[var(--mf-muted)]">{label}</p>
            <div className="mf-shop-browse__rail" role="list">
                {children}
            </div>
        </div>
    );
}

function BrowseChip({ active, onClick, children, ariaLabel }) {
    return (
        <button
            type="button"
            role="listitem"
            className={['mf-shop-browse__chip', active ? 'is-active' : ''].filter(Boolean).join(' ')}
            aria-pressed={active}
            aria-label={ariaLabel}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

/**
 * The store's persistent filter rail: product type, fandom, category, league
 * and club aisles plus the sort / in-stock toolbar. Stacks above the grid on
 * mobile; sits on the left on desktop via .mf-split--rail.
 */
export default function ShopFilters({
    activeFilters,
    types,
    fandoms,
    categories,
    leagues,
    clubs,
    favourite_club_id,
    products,
    selectedType,
    selectedFandom,
    selectedCategory,
    selectedLeague,
    selectedClub,
}) {
    const favouriteClub = favourite_club_id
        ? clubs.find((club) => String(club.id) === String(favourite_club_id))
        : null;
    const showClubAisles = !activeFilters.type || activeFilters.type === 'apparel';

    return (
        <div className="mf-shop-rail">
            <div className="mf-shop-rail__group">
                <p className="mf-shop-rail__title mf-text-caption text-[var(--mf-muted)]">Shop</p>
                <TypeSegment
                    types={types}
                    activeType={activeFilters.type || undefined}
                    onSelect={(type) => updateFilters(activeFilters, { type })}
                />
            </div>

            {fandoms.length > 0 ? (
                <BrowseChips label="By fandom">
                    <BrowseChip
                        active={!activeFilters.fandom_id}
                        onClick={() => updateFilters(activeFilters, { fandom_id: undefined })}
                        ariaLabel="All fandoms"
                    >
                        All fandoms
                    </BrowseChip>
                    {fandoms.map((fandom) => (
                        <BrowseChip
                            key={fandom.id}
                            active={String(activeFilters.fandom_id) === String(fandom.id)}
                            onClick={() => toggleFilter(activeFilters, 'fandom_id', fandom.id)}
                            ariaLabel={fandom.name}
                        >
                            {fandom.icon ? <span aria-hidden>{fandom.icon}</span> : null}
                            <span className="mf-shop-browse__name">{fandom.name}</span>
                        </BrowseChip>
                    ))}
                </BrowseChips>
            ) : null}

            {categories.length > 0 ? (
                <div className="mf-shop-rail__group">
                    <p className="mf-shop-rail__title mf-text-caption text-[var(--mf-muted)]">Category</p>
                    <CategorySegment
                        categories={categories}
                        activeCategory={activeFilters.category || undefined}
                        onSelect={(category) =>
                            updateFilters(activeFilters, {
                                category:
                                    category && activeFilters.category === category ? undefined : category,
                            })
                        }
                    />
                </div>
            ) : null}

            {showClubAisles && leagues.length > 0 ? (
                <BrowseChips label="By league">
                    <BrowseChip
                        active={!activeFilters.league_id}
                        onClick={() => updateFilters(activeFilters, { league_id: undefined })}
                        ariaLabel="All leagues"
                    >
                        All leagues
                    </BrowseChip>
                    {leagues.map((league) => (
                        <BrowseChip
                            key={league.id}
                            active={String(activeFilters.league_id) === String(league.id)}
                            onClick={() => toggleFilter(activeFilters, 'league_id', league.id)}
                            ariaLabel={league.name}
                        >
                            <span className="mf-shop-browse__short mf-mono">{league.short}</span>
                            <span className="mf-shop-browse__name">{league.name}</span>
                        </BrowseChip>
                    ))}
                </BrowseChips>
            ) : null}

            {showClubAisles && clubs.length > 0 ? (
                <BrowseChips label="By club">
                    <BrowseChip
                        active={!activeFilters.club_id}
                        onClick={() => updateFilters(activeFilters, { club_id: undefined })}
                        ariaLabel="All clubs"
                    >
                        All clubs
                    </BrowseChip>
                    {favouriteClub ? (
                        <BrowseChip
                            active={String(activeFilters.club_id) === String(favourite_club_id)}
                            onClick={() => toggleFilter(activeFilters, 'club_id', favourite_club_id)}
                            ariaLabel="My club"
                        >
                            <span className="mf-shop-browse__crest">
                                <ShopCrest club={favouriteClub} />
                            </span>
                            My club
                        </BrowseChip>
                    ) : null}
                    {clubs.map((club) => (
                        <BrowseChip
                            key={club.id}
                            active={String(activeFilters.club_id) === String(club.id)}
                            onClick={() => toggleFilter(activeFilters, 'club_id', club.id)}
                            ariaLabel={club.name}
                        >
                            <span className="mf-shop-browse__crest">
                                <ShopCrest club={club} />
                            </span>
                            <span className="mf-shop-browse__short mf-mono">{club.short}</span>
                            <span className="mf-shop-browse__name">{club.name}</span>
                        </BrowseChip>
                    ))}
                </BrowseChips>
            ) : null}

            <div className="mf-shop-toolbar" role="search" aria-label="Sort and stock filters">
                <label className="mf-shop-filter">
                    <span className="mf-text-caption text-[var(--mf-muted)]">Sort</span>
                    <select
                        className="mf-shop-filter__control"
                        value={activeFilters.sort}
                        onChange={(e) =>
                            updateFilters(activeFilters, {
                                sort: e.target.value === 'name' ? undefined : e.target.value,
                            })
                        }
                    >
                        <option value="name">Name</option>
                        <option value="price_asc">Price ↑</option>
                        <option value="price_desc">Price ↓</option>
                        <option value="newest">Newest</option>
                    </select>
                </label>

                <label className="mf-shop-filter mf-shop-filter--toggle">
                    <input
                        type="checkbox"
                        checked={activeFilters.in_stock}
                        onChange={(e) =>
                            updateFilters(activeFilters, {
                                in_stock: e.target.checked ? 1 : undefined,
                            })
                        }
                    />
                    <span>In stock only</span>
                </label>

                <p className="mf-shop-toolbar__count mf-mono">
                    {products.length} {products.length === 1 ? 'item' : 'items'}
                    {selectedType ? ` · ${productTypeLabel(selectedType.value)}` : ''}
                    {selectedFandom ? ` · ${selectedFandom.name}` : ''}
                    {selectedCategory ? ` · ${categoryAbbr(selectedCategory.slug)}` : ''}
                    {selectedLeague ? ` · ${selectedLeague.short || selectedLeague.name}` : ''}
                    {selectedClub ? ` · ${selectedClub.short || selectedClub.name}` : ''}
                </p>
            </div>
        </div>
    );
}
