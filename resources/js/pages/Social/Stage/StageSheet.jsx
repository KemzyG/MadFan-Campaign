import { useEffect } from 'react';
import { IconClose } from './StageIcons';

/**
 * Bottom-sheet shell shared by the create, settings and share flows. Owns the
 * backdrop, Escape-to-close and body scroll lock; each caller supplies the head
 * copy and the body (usually a scroll region plus a sticky footer).
 */
export default function StageSheet({
    open,
    onClose,
    labelledBy,
    icon = null,
    eyebrow = null,
    title,
    subtitle = null,
    className = '',
    children,
}) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className={`mf-sheet mf-sheet--stage ${className}`.trim()} role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close" onClick={onClose} />
            <div
                className="mf-sheet__panel mf-sheet__panel--stage"
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
            >
                <div className="mf-sheet__handle" aria-hidden />

                <div className="mf-sheet__head mf-stage-sheet__head">
                    {icon ? (
                        <span className="mf-stage-sheet__icon-wrap" aria-hidden>
                            {icon}
                        </span>
                    ) : null}
                    <div className="min-w-0">
                        {eyebrow ? <p className="mf-text-caption text-[var(--mf-pitch)]">{eyebrow}</p> : null}
                        <p id={labelledBy} className="mf-stage-sheet__title">
                            {title}
                        </p>
                        {subtitle ? <p className="mf-text-meta text-[var(--mf-muted)]">{subtitle}</p> : null}
                    </div>
                    <button
                        type="button"
                        className="mf-stage-icon-btn mf-stage-sheet__close"
                        aria-label="Close"
                        title="Close"
                        onClick={onClose}
                    >
                        <IconClose />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}
