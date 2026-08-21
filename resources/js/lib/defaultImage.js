/**
 * Default thumbnail when Social images fail to load.
 * Prefer the backend-shared `app.default_image_url` (Cloudinary or local).
 */
export const LOCAL_DEFAULT_IMAGE = '/default-avatar.png';

/**
 * @param {{ app?: { default_image_url?: string } } | null | undefined} pageProps
 */
export function resolveDefaultImageUrl(pageProps) {
    return pageProps?.app?.default_image_url || LOCAL_DEFAULT_IMAGE;
}

/**
 * Swap a broken <img> to the default thumbnail once (avoids infinite error loops).
 *
 * @param {React.SyntheticEvent<HTMLImageElement>} event
 * @param {string} [fallbackUrl]
 */
export function onImageError(event, fallbackUrl = LOCAL_DEFAULT_IMAGE) {
    const img = event.currentTarget;

    if (img.dataset.mfFallbackApplied === '1') {
        return;
    }

    img.dataset.mfFallbackApplied = '1';
    img.src = fallbackUrl || LOCAL_DEFAULT_IMAGE;
}
