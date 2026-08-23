import { useEffect } from 'react';

/**
 * Back chevron used in the mobile detail-sheet header.
 */
function BackIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6 9 12l6 6" />
        </svg>
    );
}

/**
 * SplitView — the shared responsive two-pane primitive for the Social content
 * pages. See resources/css/social/split.css for the layout contract.
 *
 *   mode="detail"  master list (primary) + a detail pane. Desktop: side by
 *                  side. Mobile: the detail rides in as a fixed overlay sheet
 *                  when `detailOpen` is true (a row was selected).
 *   mode="rail"    a persistent context rail + main content. Desktop: rail on
 *                  the left. Mobile: the rail stacks above the content.
 *
 * The component always renders both panes; CSS decides how they present at each
 * breakpoint, so `detailOpen` is inert on desktop (both panes are always shown).
 */
export default function SplitView({
    mode = 'detail',
    master,
    detail,
    rail,
    content,
    detailOpen = false,
    detailTitle,
    onCloseDetail,
    masterLabel = 'List',
    detailLabel = 'Details',
    railLabel = 'Filters',
    contentLabel = 'Content',
    className = '',
}) {
    // Escape closes the mobile detail sheet (no-op on desktop where it's inert).
    useEffect(() => {
        if (mode !== 'detail' || !detailOpen || !onCloseDetail) {
            return undefined;
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onCloseDetail();
            }
        }

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [mode, detailOpen, onCloseDetail]);

    if (mode === 'rail') {
        return (
            <div className={['mf-split', 'mf-split--rail', className].filter(Boolean).join(' ')}>
                <aside className="mf-split__rail" aria-label={railLabel}>
                    {rail}
                </aside>
                <section className="mf-split__content" aria-label={contentLabel}>
                    {content}
                </section>
            </div>
        );
    }

    return (
        <div
            className={[
                'mf-split',
                'mf-split--detail',
                detailOpen ? 'is-detail-open' : '',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <section className="mf-split__master" aria-label={masterLabel}>
                {master}
            </section>

            <section className="mf-split__detail" aria-label={detailLabel}>
                <div className="mf-split__detail-head">
                    <button
                        type="button"
                        className="mf-split__detail-back"
                        onClick={onCloseDetail}
                        aria-label="Back to list"
                    >
                        <BackIcon />
                    </button>
                    {detailTitle ? (
                        <p className="mf-split__detail-title mf-display">{detailTitle}</p>
                    ) : null}
                </div>
                <div className="mf-split__detail-body">{detail}</div>
            </section>

            <button
                type="button"
                className="mf-split__scrim"
                aria-label="Close details"
                tabIndex={detailOpen ? 0 : -1}
                onClick={onCloseDetail}
            />
        </div>
    );
}
