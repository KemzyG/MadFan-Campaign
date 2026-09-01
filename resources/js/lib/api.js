function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function adminApiBase() {
    const fromMeta = document.querySelector('meta[name="admin-path"]')?.getAttribute('content');
    const base = fromMeta === '' || fromMeta === '/'
        ? ''
        : (fromMeta || '/ops').replace(/\/$/, '');

    return base === '' ? '/api' : `${base}/api`;
}

function formatValidationErrors(errors) {
    if (!errors || typeof errors !== 'object') {
        return null;
    }

    return Object.values(errors).flat().join(' ');
}

export async function adminApi(path, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
        Accept: 'application/json',
        'X-CSRF-TOKEN': csrfToken(),
        ...(options.headers ?? {}),
    };

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${adminApiBase()}${path.startsWith('/') ? path : `/${path}`}`, {
        ...options,
        headers,
        credentials: 'same-origin',
        body: options.body
            ? isFormData
                ? options.body
                : JSON.stringify(options.body)
            : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validationMessage = formatValidationErrors(data.errors);
        const message = validationMessage ?? data.message ?? data.error ?? 'Request failed';

        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
    }

    return data;
}
