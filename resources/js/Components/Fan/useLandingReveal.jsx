import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Lightweight Intersection Observer reveal for landing sections.
 *
 * @param {IntersectionObserverInit} [options]
 * @returns {[import('react').RefObject<HTMLElement | null>, boolean]}
 */
export function useLandingReveal(options = {}) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;

        if (!node) {
            return undefined;
        }

        if (prefersReducedMotion()) {
            setVisible(true);

            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.12,
                rootMargin: '0px 0px -6% 0px',
                ...options,
            },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    return [ref, visible];
}

/**
 * @param {{
 *   as?: keyof JSX.IntrinsicElements,
 *   className?: string,
 *   stagger?: boolean,
 *   children: import('react').ReactNode,
 * }} props
 */
export function LandingReveal({ as: Tag = 'div', className = '', stagger = false, children, ...props }) {
    const [ref, visible] = useLandingReveal();
    const classes = [
        stagger ? 'mf-land__reveal-stagger' : 'mf-land__reveal',
        visible ? 'is-visible' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Tag ref={ref} className={classes} {...props}>
            {children}
        </Tag>
    );
}
