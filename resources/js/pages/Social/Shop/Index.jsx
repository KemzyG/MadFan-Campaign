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

function JerseyCard({ jersey, index = 0 }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    return (
        <Link
            href={`/social/shop/${jersey.slug}`}
            className="mf-shop-card"
            prefetch
            style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
        >
            <div className="mf-shop-card__media">
                {jersey.image_url ? (
                    <img
                        src={jersey.image_url}
                        alt=""
                        className="mf-shop-card__img"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-card__placeholder">
                        <ClubCrest club={jersey.club} />
                    </div>
                )}
                {jersey.gallery_count > 1 ? (
                    <span className="mf-shop-card__shots mf-mono">{jersey.gallery_count} shots</span>
                ) : null}
            </div>
            <div className="mf-shop-card__body">
                <p className="mf-text-caption text-[var(--mf-muted)]">
                    {jersey.club?.name || 'Mad Fan kit'}
                </p>
                <h2 className="mf-shop-card__title">{jersey.name}</h2>
                <div className="mf-shop-card__meta">
                    <span className="mf-mono">£{jersey.price}</span>
                    {jersey.purchasable ? (
                        <span className="mf-ticket-chip mf-mono">In stock</span>
                    ) : (
                        <span className="mf-ticket-chip mf-mono">Sold out</span>
                    )}
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

    return (
        <SocialShell title="Shop">
            <Head title="Jersey mall — Mad Fan Social" />

            <div className="mf-shop mf-shop--mall">
                <div className="mf-shop-mall-hero">
                    <div className="mf-shop-mall-hero__copy">
                        <p className="mf-tickets-kicker mf-text-caption">Mad Fan mall</p>
                        <h1 className="mf-empty-title mf-tickets-title">Jersey floor</h1>
                        <p className="mf-tickets-lead">
                            Club kits in one aisle — filter by club, sort the rail, bag a size. Checkout stays
                            shipping-only on this pass.
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
                </div>

                <div className="mf-shop-toolbar">
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
                    </p>
                </div>

                {jerseys.length === 0 ? (
                    <p className="mf-empty-copy">No jerseys match these filters.</p>
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
