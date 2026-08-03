const inputClass =
    'w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500';

/**
 * @param {{ label: string, children: import('react').ReactNode, hint?: string, error?: string }} props
 */
export function FormField({ label, children, hint, error }) {
    return (
        <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
            {children}
            {hint ? <span className="block text-xs text-zinc-500">{hint}</span> : null}
            {error ? <span className="block text-xs text-red-400">{error}</span> : null}
        </label>
    );
}

export function TextInput(props) {
    return <input className={inputClass} {...props} />;
}

export function TextSelect(props) {
    return <select className={inputClass} {...props} />;
}

export function TextTextarea(props) {
    return <textarea className={`${inputClass} min-h-[80px]`} {...props} />;
}

export { TextInput as FormInput, TextSelect as FormSelect, TextTextarea as FormTextarea };

export { inputClass };
