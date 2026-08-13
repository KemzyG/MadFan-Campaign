import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';

function ClubCrest({ club }) {
    if (club?.logo_url) {
        return <img src={club.logo_url} alt="" className="mf-shop-crest__img" />;
    }

    return (
        <span className="mf-shop-crest__mark mf-display" aria-hidden>
            {(club?.short || club?.name || 'MF').slice(0, 3)}
        </span>
    );
}

function JerseyCard({ jersey }) {
    return (
        <Link href={`/social/shop/${jersey.slug}`} className="mf-shop-card" prefetch>
            <div className="mf-shop-card__media">
                {jersey.image_url ? (
                    <img src={jersey.image_url} alt="" className="mf-shop-card__img" />
                ) : (
                    <div className="mf-shop-card__placeholder">
                        <ClubCrest club={jersey.club} />
                    </div>
                )}
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

export default function Index({ jerseys = [], cart_count = 0 }) {
    return (
        <SocialShell title="Shop">
            <Head title="Jersey shop — Mad Fan Social" />

            <div className="mf-shop">
                <div className="mf-tickets-hero">
                    <p className="mf-tickets-kicker mf-text-caption">Kit room</p>
                    <p className="mf-empty-title mf-tickets-title">Jersey marketplace</p>
                    <p className="mf-tickets-lead">
                        Browse club kits, bag a size, confirm shipping — stock drops on confirm. No card
                        rails on this pass.
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

                {jerseys.length === 0 ? (
                    <p className="mf-empty-copy">No jerseys listed yet.</p>
                ) : (
                    <div className="mf-shop-grid">
                        {jerseys.map((jersey) => (
                            <JerseyCard key={jersey.id} jersey={jersey} />
                        ))}
                    </div>
                )}
            </div>
        </SocialShell>
    );
}
