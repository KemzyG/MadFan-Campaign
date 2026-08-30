/** Shared by ViewerCountBadge/LikesCountBadge — 999, 1.2K, 3M. */
export function formatCount(count) {
    const n = Number(count) || 0;
    if (n < 1000) {
        return String(n);
    }
    if (n < 1000000) {
        return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}K`;
    }
    return `${(n / 1000000).toFixed(1)}M`;
}
