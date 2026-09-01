const BADGE_CLASS = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    brand: '',
    default: '',
    danger: '',
};

export function adminBadgeClass(variant) {
    return BADGE_CLASS[variant] ?? '';
}

export function adminBadgeVariant(variant) {
    if (variant === 'danger') {
        return 'destructive';
    }

    if (variant === 'warning') {
        return 'outline';
    }

    return 'secondary';
}
