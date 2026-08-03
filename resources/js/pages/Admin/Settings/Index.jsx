import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import PageHeader from '../../../Components/PageHeader';
import { adminPath } from '../../../lib/adminPath';

function FieldInput({ field, value, onChange, error }) {
    if (field.type === 'boolean') {
        const checked = value === true || value === 'true';

        return (
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded border-white/20 bg-surface-700 text-brand-500"
            />
        );
    }

    if (field.type === 'select') {
        return (
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm text-zinc-200"
            >
                {Object.entries(field.options ?? {}).map(([optionValue, optionLabel]) => (
                    <option key={optionValue || 'none'} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <input
            type={field.type === 'integer' ? 'number' : field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.type === 'password' ? 'Leave blank to keep current password' : undefined}
            className="w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm text-zinc-200"
        />
    );
}

export default function SettingsIndex({ segments = [] }) {
    const page = usePage();
    const initial = {};

    segments.forEach((segment) => {
        segment.sections?.forEach((section) => {
            section.fields?.forEach((field) => {
                initial[field.key] =
                    field.type === 'boolean'
                        ? field.value === 'true' || field.value === true
                        : field.value ?? '';
            });
        });
    });

    const { data, setData, put, processing, errors } = useForm(initial);
    const [activeSegment, setActiveSegment] = useState(segments[0]?.key ?? 'general');

    function submit(e) {
        e.preventDefault();
        put(adminPath(page.props, 'settings'));
    }

    const currentSegment = segments.find((segment) => segment.key === activeSegment) ?? segments[0];

    return (
        <AdminLayout title="Settings">
            <PageHeader
                title="Application settings"
                description="Configure general options, email delivery, social verification, and system controls."
            />

            <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
                    {segments.map((segment) => (
                        <button
                            key={segment.key}
                            type="button"
                            onClick={() => setActiveSegment(segment.key)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                activeSegment === segment.key
                                    ? 'bg-brand-500 text-surface-900'
                                    : 'bg-surface-800 text-zinc-300 hover:bg-surface-700'
                            }`}
                        >
                            {segment.label}
                        </button>
                    ))}
                </div>

                {currentSegment?.sections?.map((section) => (
                    <section
                        key={section.key}
                        className="rounded-2xl border border-white/5 bg-surface-800/50 p-6"
                    >
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-300">
                            {section.label}
                        </h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {section.fields?.map((field) => (
                                <label
                                    key={field.key}
                                    className={`block ${field.type === 'password' ? 'sm:col-span-2' : ''}`}
                                >
                                    <span className="text-sm font-medium text-zinc-200">{field.label}</span>
                                    <p className="mb-2 text-xs text-zinc-500">{field.description}</p>
                                    <FieldInput
                                        field={field}
                                        value={data[field.key]}
                                        onChange={(value) => setData(field.key, value)}
                                        error={errors[field.key]}
                                    />
                                    {errors[field.key] && (
                                        <p className="mt-1 text-xs text-red-400">{errors[field.key]}</p>
                                    )}
                                </label>
                            ))}
                        </div>
                    </section>
                ))}

                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-surface-900 hover:bg-brand-400 disabled:opacity-60"
                >
                    {processing ? 'Saving…' : 'Save settings'}
                </button>
            </form>
        </AdminLayout>
    );
}
