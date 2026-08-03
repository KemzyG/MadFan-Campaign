/**
 * Shared admin modal shell.
 */
export default function Modal({ title, children, onClose, wide = false, footer = null }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div
                role="dialog"
                aria-modal="true"
                className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-surface-800 p-6 shadow-xl ${
                    wide ? 'max-w-3xl' : 'max-w-md'
                }`}
            >
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm text-zinc-500 transition hover:text-zinc-300"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <div className="mt-4">{children}</div>
                {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
            </div>
        </div>
    );
}
