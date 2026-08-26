import { IconFilter, IconSearch } from './icons';

/**
 * Title, subtitle, and the two utility actions (search + filter). Filter is
 * a stub hook for now — it opens the same group pills already below it on
 * mobile, where they can scroll out of view.
 */
export default function DiscoverHeader({ onOpenSearch, onOpenFilter }) {
    return (
        <header className="mf-fd-header">
            <div className="mf-fd-header__copy">
                <h1 className="mf-fd-header__title">Fandom</h1>
                <p className="mf-fd-header__subtitle">Follow what you love. Fan together.</p>
            </div>
            <div className="mf-fd-header__actions">
                <button
                    type="button"
                    className="mf-fd-header__icon-btn"
                    aria-label="Search fandoms"
                    title="Search"
                    onClick={onOpenSearch}
                >
                    <IconSearch />
                </button>
                <button
                    type="button"
                    className="mf-fd-header__icon-btn"
                    aria-label="Filter fandoms"
                    title="Filter"
                    onClick={onOpenFilter}
                >
                    <IconFilter />
                </button>
            </div>
        </header>
    );
}
