import { useEffect, useId } from 'react';
import FeedComposer from './FeedComposer';

/**
 * Bottom-sheet wrapper around {@link FeedComposer} for composing a new post.
 */
export default function ComposeSheet({ open, onClose, maxBodyLength = 280, maxImages = 4 }) {
    const titleId = useId();

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
        <div className="mf-sheet" role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close composer" onClick={onClose} />
            <div className="mf-sheet__panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="mf-sheet__handle" aria-hidden />
                <div className="mf-sheet__head">
                    <p id={titleId} className="mf-display mf-text-title tracking-[0.03em]">
                        New post
                    </p>
                    <button type="button" className="mf-sheet__close" onClick={onClose}>
                        Cancel
                    </button>
                </div>
                <FeedComposer
                    maxBodyLength={maxBodyLength}
                    maxImages={maxImages}
                    autoFocus
                    onSuccess={onClose}
                    variant="sheet"
                />
            </div>
        </div>
    );
}
