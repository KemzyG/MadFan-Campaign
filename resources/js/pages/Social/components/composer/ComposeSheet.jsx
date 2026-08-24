import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from '../post/icons';
import FeedComposer from './FeedComposer';

/**
 * Full-height sheet wrapper around {@link FeedComposer} for composing a new post.
 * Portals to <body> so it escapes any ancestor stacking context (same approach
 * as the Stage sheet) and locks background scroll while open.
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

    return createPortal(
        <div className="mf-sheet mf-sheet--full" role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close composer" onClick={onClose} />
            <div className="mf-sheet__panel mf-sheet__panel--full" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="mf-sheet__head mf-sheet__head--full">
                    <button type="button" className="mf-stage-icon-btn" aria-label="Close" title="Close" onClick={onClose}>
                        <IconClose />
                    </button>
                    <p id={titleId} className="mf-display mf-text-title tracking-[0.03em]">
                        New post
                    </p>
                    <span className="mf-sheet__head-spacer" aria-hidden />
                </div>
                <FeedComposer
                    maxBodyLength={maxBodyLength}
                    maxImages={maxImages}
                    autoFocus
                    onSuccess={onClose}
                    variant="sheet"
                />
            </div>
        </div>,
        document.body,
    );
}
