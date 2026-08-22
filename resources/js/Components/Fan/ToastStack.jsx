/**
 * @param {{ toasts: Array<{id: number, tone: 'ok'|'err', message: string}>, onDismiss: (id: number) => void }} props
 */
export default function ToastStack({ toasts, onDismiss }) {
    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="mf-toast-stack" aria-live="polite" aria-relevant="additions">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`mf-toast mf-toast--${toast.tone}`}
                    role={toast.tone === 'err' ? 'alert' : 'status'}
                >
                    <span className="mf-toast__mark" aria-hidden />
                    <p className="mf-toast__copy">{toast.message}</p>
                    <button
                        type="button"
                        className="mf-toast__dismiss"
                        aria-label="Dismiss"
                        onClick={() => onDismiss(toast.id)}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
