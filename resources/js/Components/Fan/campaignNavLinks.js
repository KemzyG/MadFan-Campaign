export const CAMPAIGN_NAV_LINKS = [
    { href: '/about', label: 'About' },
    { href: '/roadmap', label: 'Roadmap' },
    { href: '/team', label: 'Team' },
    { href: '/region', label: 'Region' },
];

export const CAMPAIGN_NAV_PATHS = CAMPAIGN_NAV_LINKS.map((link) => link.href);

export function isWelcomeAreaPath(pathname) {
    return pathname === '/' || CAMPAIGN_NAV_PATHS.includes(pathname);
}
