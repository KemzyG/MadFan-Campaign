import { Head, Link, router, usePage } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

function ClubCrest({ club }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (club?.logo_url) {
        return (
            <img
                src={club.logo_url}
                alt=""
                className="mf-shop-crest__img"
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    return (
        <span className="mf-shop-crest__mark mf-display" aria-hidden>
            {(club?.short || club?.name || 'MF').slice(0, 3)}
        </span>
    );
}

function stockChipClass(purchasable) {
    return [
        'mf-ticket-chip',
        'mf-mono',
        purchasable ? 'mf-ticket-chip--owned' : 'mf-shop-chip--out',
    ]
        .filter(Boolean)
        .join(' ');
}

function JerseyCard({ jersey, index = 0 }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const sizesPreview = (jersey.sizes_available || []).slice(0, 4);

    return (
        <Link
            href={`/social/shop/${jersey.slug}`}
            className="mf-shop-card"
            prefetch
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
        >
            <div className="mf-shop-card__media">
                {jersey.image_url ? (
                    <img
                        src={jersey.image_url}
                        alt=""
                        className="mf-shop-card__img"
                        loading="lazy"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-card__placeholder">
                        <ClubCrest club={jersey.club} />
                    </div>
                )}
                <div className="mf-shop-card__badges">
                    {jersey.kit_kind ? (
                        <span className="mf-shop-card__kind mf-mono">{jersey.kit_kind}</span>
                    ) : null}
                    {jersey.gallery_count > 1 ? (
                        <span className="mf-shop-card__shots mf-mono">{jersey.gallery_count} shots</span>
                    ) : null}
                </div>
            </div>
            <div className="mf-shop-card__body">
                <div className="mf-shop-card__club">
                    <span className="mf-shop-card__crest" aria-hidden>
                        <ClubCrest club={jersey.club} />
                    </span>
                    <p className="mf-text-caption text-[var(--mf-muted)]">
                        {jersey.club?.name || 'Mad Fan kit'}
                    </p>
                </div>
                <h2 className="mf-shop-card__title mf-display">{jersey.name}</h2>
                {sizesPreview.length > 0 ? (
                    <p className="mf-shop-card__sizes mf-mono">
                        {sizesPreview.join(' · ')}
                        {(jersey.sizes_available || []).length > sizesPreview.length ? ' · …' : ''}
                    </p>
                ) : (
                    <p className="mf-shop-card__sizes mf-mono">No sizes left</p>
                )}
                <div className="mf-shop-card__meta">
                    <span className="mf-shop-card__price mf-mono">£{jersey.price}</span>
                    <span className={stockChipClass(jersey.purchasable)}>
                        {jersey.purchasable ? 'In stock' : 'Sold out'}
                    </span>
                </div>
            </div>
        </Link>
    );
}

function updateFilters(filters, patch) {
    const next = {
        club_id: filters.club_id || undefined,
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

function hasActiveFilters(filters) {
    return Boolean(filters.club_id || filters.in_stock || (filters.sort && filters.sort !== 'name'));
}

export default function Index({
    jerseys = [],
    clubs = [],
    cart_count = 0,
    filters = {},
    favourite_club_id = null,
}) {
    const activeFilters = {
        club_id: filters.club_id ?? '',
        sort: filters.sort ?? 'name',
        in_stock: Boolean(filters.in_stock),
    };
    const filtersOn = hasActiveFilters(activeFilters);
    const selectedClub = clubs.find((club) => String(club.id) === String(activeFilters.club_id));

    return (
        <SocialShell title="Shop">
            <Head title="Jersey mall — Mad Fan Social" />

            <div className="mf-shop mf-shop--mall">
                <header className="mf-shop-mall-hero">
                    <div className="mf-shop-mall-hero__copy">
                        <p className="mf-tickets-kicker mf-text-caption">Mad Fan mall</p>
                        <h1 className="mf-empty-title mf-tickets-title">Jersey floor</h1>
                        <p className="mf-tickets-lead">
                            Club kits on one rail — filter by side, sort the aisle, bag a size.
                            Checkout stays shipping-only on this pass.
                        </p>
                        <div className="mf-shop-hero-links">
                            <Link href="/social/shop/cart" className="mf-tickets-mine-link" prefetch>
                                Bag
                                {cart_count > 0 ? (
                                    <span className="mf-mono mf-tickets-count">{cart_count}</span>
                                ) : null}
                            </Link>
                            <Link href="/social/shop/orders" className="mf-tickets-mine-link" prefetch>
                                My orders
                            </Link>
                        </div>
                    </div>
                    <div className="mf-shop-mall-hero__rail" aria-hidden>
                        <span className="mf-shop-mall-hero__mark mf-display">KIT</span>
                        <span className="mf-shop-mall-hero__mark mf-display">ROOM</span>
                    </div>
                </header>

                <div className="mf-shop-toolbar" role="search" aria-label="Filter kits">
                    <label className="mf-shop-filter">
                        <span className="mf-text-caption text-[var(--mf-muted)]">Club</span>
                        <select
                            className="mf-shop-filter__control"
                            value={activeFilters.club_id}
                            onChange={(e) =>
                                updateFilters(activeFilters, {
                                    club_id: e.target.value || undefined,
                                })
                            }
                        >
                            <option value="">All clubs</option>
                            {favourite_club_id ? (
                                <option value={favourite_club_id}>My club</option>
                            ) : null}
                            {clubs.map((club) => (
                                <option key={club.id} value={club.id}>
                                    {club.name}
                                </option>
                            ))}
                        </select>
                    </label>

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
                        {jerseys.length} {jerseys.length === 1 ? 'kit' : 'kits'}
                        {selectedClub ? ` · ${selectedClub.short || selectedClub.name}` : ''}
                    </p>
                </div>

                {jerseys.length === 0 ? (
                    <div className="mf-empty mf-empty--compact mf-shop-empty">
                        <p className="mf-empty-title">No kits on this rail</p>
                        <p className="mf-empty-copy">
                            {filtersOn
                                ? 'Nothing matches these filters — clear them or pick another club.'
                                : 'The jersey floor is empty right now. Check back after the next drop.'}
                        </p>
                        {filtersOn ? (
                            <button
                                type="button"
                                className="mf-btn mf-btn--ghost"
                                onClick={() => router.get('/social/shop', {}, { replace: true })}
                            >
                                Clear filters
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className="mf-shop-grid mf-shop-grid--mall">
                        {jerseys.map((jersey, index) => (
                            <JerseyCard key={jersey.id} jersey={jersey} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </SocialShell>
    );
}
