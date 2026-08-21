function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function xsrfToken() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

function formatValidationErrors(errors) {
    if (!errors || typeof errors !== 'object') {
        return null;
    }

    const parts = Object.values(errors)
        .flat()
        .filter((value) => typeof value === 'string' && value.trim());

    return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Session-authenticated Social JSON API (web CSRF + Accept: application/json).
 *
 * @param {string} path Absolute path under /api/social or a full /api/social/... path
 * @param {{ method?: string, body?: object|FormData|null, headers?: Record<string, string> }} [options]
 * @returns {Promise<object>}
 */
export async function socialApi(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.headers ?? {}),
    };

    const csrf = csrfToken();
    if (csrf) {
        headers['X-CSRF-TOKEN'] = csrf;
    }

    const xsrf = xsrfToken();
    if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf;
    }

    if (options.body != null && !isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const normalized = path.startsWith('/') ? path : `/${path}`;
    const url = normalized.startsWith('/api/social')
        ? normalized
        : `/api/social${normalized}`;

    const response = await fetch(url, {
        method,
        headers,
        credentials: 'same-origin',
        body:
            options.body == null
                ? undefined
                : isFormData
                  ? options.body
                  : JSON.stringify(options.body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validationMessage = formatValidationErrors(data.errors);
        const message =
            validationMessage
            ?? (typeof data.message === 'string' ? data.message : null)
            ?? (typeof data.error === 'string' ? data.error : null)
            ?? `Request failed (${response.status})`;

        const error = new Error(message);
        error.status = response.status;
        error.payload = data;
        throw error;
    }

    return data;
}
