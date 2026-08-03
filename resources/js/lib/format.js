export function formatNumber(value) {
    return new Intl.NumberFormat().format(value ?? 0);
}

export function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
