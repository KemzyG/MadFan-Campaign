export default function Badge({ children, variant = 'default' }) {
    const variants = {
        default: 'bg-white/10 text-zinc-300',
        success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20',
        warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20',
        danger: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/20',
        brand: 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/20',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant] ?? variants.default}`}
        >
            {children}
        </span>
    );
}
