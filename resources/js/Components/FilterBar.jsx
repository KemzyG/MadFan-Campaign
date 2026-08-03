import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function FilterBar({ fields, filters, route }) {
    const [values, setValues] = useState(filters ?? {});

    function submit(e) {
        e.preventDefault();
        router.get(route, values, { preserveState: true, replace: true });
    }

    function reset() {
        setValues({});
        router.get(route, {}, { preserveState: true, replace: true });
    }

    return (
        <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3">
            {fields.map((field) => (
                <label key={field.name} className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-500">{field.label}</span>
                    {field.type === 'select' ? (
                        <select
                            value={values[field.name] ?? ''}
                            onChange={(e) =>
                                setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                            }
                            className="rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm text-zinc-200"
                        >
                            <option value="">All</option>
                            {field.options?.map((opt) => (
                                <option key={opt.value ?? opt} value={opt.value ?? opt}>
                                    {opt.label ?? opt}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={field.type ?? 'text'}
                            value={values[field.name] ?? ''}
                            onChange={(e) =>
                                setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                            }
                            placeholder={field.placeholder}
                            className="rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
                        />
                    )}
                </label>
            ))}
            <button
                type="submit"
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900 hover:bg-brand-400"
            >
                Filter
            </button>
            <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
            >
                Reset
            </button>
        </form>
    );
}
