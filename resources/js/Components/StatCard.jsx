import { formatNumber } from '../lib/format';

export default function StatCard({ label, value, hint, accent = 'brand' }) {
    const accents = {
        brand: 'from-brand-500/20 to-brand-600/5 border-brand-500/20 text-brand-300',
        emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-300',
        sky: 'from-sky-500/20 to-sky-600/5 border-sky-500/20 text-sky-300',
        violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-300',
    };

    return (
        <div
            className={`rounded-2xl border bg-gradient-to-br p-5 ${accents[accent] ?? accents.brand}`}
        >
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatNumber(value)}</p>
            {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
        </div>
    );
}
