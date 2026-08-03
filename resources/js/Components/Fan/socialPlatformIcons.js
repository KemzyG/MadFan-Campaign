export function socialPlatformIcon(platform) {
    const p = (platform || '').toLowerCase();

    if (p === 'x' || p === 'twitter') {
        return { src: '/icons/twitter.png', alt: 'X', dot: 'dot-x' };
    }

    if (p === 'telegram') {
        return { src: '/icons/telegram.png', alt: 'Telegram', dot: 'dot-tg' };
    }

    if (p === 'discord') {
        return { src: '/icons/discord.png', alt: 'Discord', dot: 'dot-dc' };
    }

    return { src: '/icons/share-arrow.png', alt: 'Task', dot: 'dot-share' };
}
