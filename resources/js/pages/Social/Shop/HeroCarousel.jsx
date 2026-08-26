import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import ShopCrest from './ShopCrest';
import { formatPrice } from './productMeta';

function HeroProductCard({ product, isActive = false }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    return (
        <Link
            href={`/social/shop/${product.slug}`}
            className="mf-shop-hero-kit"
            prefetch
            aria-hidden={!isActive}
            tabIndex={isActive ? 0 : -1}
        >
            <div className="mf-shop-hero-kit__media">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt=""
                        className="mf-shop-hero-kit__img"
                        loading={isActive ? 'eager' : 'lazy'}
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-hero-kit__placeholder">
                        <ShopCrest club={product.club} fallbackLabel={product.brand} />
                    </div>
                )}
            </div>
            <div className="mf-shop-hero-kit__body">
                <p className="mf-shop-hero-kit__club mf-text-caption">
                    {product.club?.name || product.brand || 'Mad Fan'}
                </p>
                <p className="mf-shop-hero-kit__name mf-display">{product.name}</p>
                <p className="mf-shop-hero-kit__price mf-mono">{formatPrice(product.price, product.currency)}</p>
            </div>
        </Link>
    );
}

/**
 * Auto-rotating hero carousel of featured products, with dots and touch swipe.
 */
export default function HeroCarousel({ products = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const touchStartX = useRef(null);

    useEffect(() => {
        setActiveIndex(0);
    }, [products]);

    useEffect(() => {
        if (products.length <= 1) {
            return undefined;
        }

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (motionQuery.matches) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % products.length);
        }, 4500);

        return () => window.clearInterval(timer);
    }, [products.length]);

    const goTo = (index) => {
        if (products.length === 0) {
            return;
        }

        const wrapped = ((index % products.length) + products.length) % products.length;

        setActiveIndex(wrapped);
    };

    const onTouchStart = (event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    };

    const onTouchEnd = (event) => {
        if (touchStartX.current === null) {
            return;
        }

        const delta = touchStartX.current - (event.changedTouches[0]?.clientX ?? touchStartX.current);

        if (Math.abs(delta) > 42) {
            goTo(activeIndex + (delta > 0 ? 1 : -1));
        }

        touchStartX.current = null;
    };

    if (products.length === 0) {
        return null;
    }

    return (
        <div
            className="mf-shop-mall-hero__carousel"
            aria-roledescription="carousel"
            aria-label="Featured products"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <div
                className="mf-shop-mall-hero__track"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
                {products.map((product, index) => (
                    <div
                        key={product.id}
                        className="mf-shop-mall-hero__slide"
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${index + 1} of ${products.length}`}
                    >
                        <HeroProductCard product={product} isActive={index === activeIndex} />
                    </div>
                ))}
            </div>
            {products.length > 1 ? (
                <div className="mf-shop-mall-hero__dots" role="tablist" aria-label="Choose product">
                    {products.map((product, index) => (
                        <button
                            key={product.id}
                            type="button"
                            role="tab"
                            aria-selected={index === activeIndex}
                            aria-label={`Show ${product.name}`}
                            className={index === activeIndex ? 'is-active' : ''}
                            onClick={() => goTo(index)}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
