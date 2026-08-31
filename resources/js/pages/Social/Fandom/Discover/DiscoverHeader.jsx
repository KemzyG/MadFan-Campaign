import { IconFilter, IconSearch } from './icons';

/**
 * Title, subtitle, the two utility actions (search + filter), and the group
 * pills — all one header band, same as they read on mobile. Filter is a
 * stub hook for now: it scrolls to the pills passed in `pills`, in case
 * they've scrolled out of view with the rest of the header.
 */
export default function DiscoverHeader({ onOpenSearch, onOpenFilter, pills }) {
    return (
        <header className="mf-fd-header">
            <div className="mf-fd-header__top">
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
            </div>
            {pills}
        </header>
    );
}
