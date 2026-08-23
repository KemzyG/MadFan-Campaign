import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import ShopCrest from './ShopCrest';

function HeroKitCard({ jersey, isActive = false }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    return (
        <Link
            href={`/social/shop/${jersey.slug}`}
            className="mf-shop-hero-kit"
            prefetch
            aria-hidden={!isActive}
            tabIndex={isActive ? 0 : -1}
        >
            <div className="mf-shop-hero-kit__media">
                {jersey.image_url ? (
                    <img
                        src={jersey.image_url}
                        alt=""
                        className="mf-shop-hero-kit__img"
                        loading={isActive ? 'eager' : 'lazy'}
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-hero-kit__placeholder">
                        <ShopCrest club={jersey.club} />
                    </div>
                )}
                {jersey.kit_kind ? (
                    <span className="mf-shop-hero-kit__kind mf-mono">{jersey.kit_kind}</span>
                ) : null}
            </div>
            <div className="mf-shop-hero-kit__body">
                <p className="mf-shop-hero-kit__club mf-text-caption">
                    {jersey.club?.name || 'Mad Fan kit'}
                </p>
                <p className="mf-shop-hero-kit__name mf-display">{jersey.name}</p>
                <p className="mf-shop-hero-kit__price mf-mono">£{jersey.price}</p>
            </div>
        </Link>
    );
}

/**
 * Auto-rotating hero carousel of featured kits, with dots and touch swipe.
 */
export default function HeroCarousel({ jerseys = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const touchStartX = useRef(null);

    useEffect(() => {
        setActiveIndex(0);
    }, [jerseys]);

    useEffect(() => {
        if (jerseys.length <= 1) {
            return undefined;
        }

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (motionQuery.matches) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % jerseys.length);
        }, 4500);

        return () => window.clearInterval(timer);
    }, [jerseys.length]);

    const goTo = (index) => {
        if (jerseys.length === 0) {
            return;
        }

        const wrapped = ((index % jerseys.length) + jerseys.length) % jerseys.length;

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

    if (jerseys.length === 0) {
        return null;
    }

    return (
        <div
            className="mf-shop-mall-hero__carousel"
            aria-roledescription="carousel"
            aria-label="Featured kits"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <div
                className="mf-shop-mall-hero__track"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
                {jerseys.map((jersey, index) => (
                    <div
                        key={jersey.id}
                        className="mf-shop-mall-hero__slide"
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${index + 1} of ${jerseys.length}`}
                    >
                        <HeroKitCard jersey={jersey} isActive={index === activeIndex} />
                    </div>
                ))}
            </div>
            {jerseys.length > 1 ? (
                <div className="mf-shop-mall-hero__dots" role="tablist" aria-label="Choose kit">
                    {jerseys.map((jersey, index) => (
                        <button
                            key={jersey.id}
                            type="button"
                            role="tab"
                            aria-selected={index === activeIndex}
                            aria-label={`Show ${jersey.name}`}
                            className={index === activeIndex ? 'is-active' : ''}
                            onClick={() => goTo(index)}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
