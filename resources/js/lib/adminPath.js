/**
 * Resolve the Inertia admin base path from shared props.
 * Empty string / "/" means the console is mounted at the host root.
 *
 * @param {{ app?: { admin_path?: string } }} [pageProps]
 */
export function adminPath(pageProps, suffix = '') {
    const raw = pageProps?.app?.admin_path;
    const base =
        raw === '' || raw === '/'
            ? ''
            : String(raw ?? '/app').replace(/\/$/, '') || '/app';

    if (!suffix) {
        return base === '' ? '/' : base;
    }

    const path = String(suffix).replace(/^\//, '');

    return base === '' ? `/${path}` : `${base}/${path}`;
}

/**
 * Absolute admin API path under /{admin}/api/...
 *
 * @param {{ app?: { admin_path?: string } }} [pageProps]
 * @param {string} apiPath
 */
export function adminApiPath(pageProps, apiPath) {
    const raw = pageProps?.app?.admin_path;
    const base =
        raw === '' || raw === '/'
            ? ''
            : String(raw ?? '/app').replace(/\/$/, '') || '/app';
    const path = String(apiPath).replace(/^\//, '');

    return base === '' ? `/api/${path}` : `${base}/api/${path}`;
}
