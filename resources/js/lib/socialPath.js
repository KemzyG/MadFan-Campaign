/**
 * Resolve a URL into the social surface, honoring SOCIAL_DOMAIN when active.
 *
 * On the default single-host setup (no SOCIAL_DOMAIN), this returns the same
 * "/social/..." relative paths used everywhere today. Once SOCIAL_DOMAIN is
 * set, social pages move to their own origin, so links to social from a
 * different host (fan/campaign pages) must be absolute or they'll bounce
 * through a server redirect Inertia can't follow client-side.
 *
 * @param {{ app?: { social_domain?: { path?: string, origin?: string, subdomain?: boolean } } }} [pageProps]
 * @param {string} [suffix]
 */
export function socialPath(pageProps, suffix = '') {
    const config = pageProps?.app?.social_domain;
    const path = String(suffix).replace(/^\//, '');

    if (config?.subdomain && config.origin) {
        return path ? `${config.origin}/${path}` : `${config.origin}/`;
    }

    return path ? `/social/${path}` : '/social';
}

/**
 * Resolve a static "/social/..." href (as used in nav/footer link tables) to
 * the real social URL. Non-social hrefs pass through unchanged.
 *
 * @param {string} href
 * @param {Parameters<typeof socialPath>[0]} pageProps
 */
export function resolveSocialHref(href, pageProps) {
    if (href === '/social' || href.startsWith('/social/')) {
        return socialPath(pageProps, href.slice('/social'.length));
    }

    return href;
}
