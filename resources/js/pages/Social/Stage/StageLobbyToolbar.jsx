import { IconFilter, IconSearch, IconSort } from './StageIcons';

/**
 * Lobby controls: a search box, filter chips, and a two-way sort toggle. Fully
 * controlled — the Index page owns the state and does the actual filtering, so
 * this stays presentational and easy to reuse.
 */
export default function StageLobbyToolbar({
    query,
    onQuery,
    filter,
    onFilter,
    filters,
    sort,
    onSort,
    sorts,
}) {
    return (
        <div className="mf-stage-toolbar" role="search">
            <label className="mf-stage-toolbar__search">
                <IconSearch className="mf-stage-toolbar__search-glyph" />
                <input
                    type="search"
                    className="mf-stage-toolbar__search-input"
                    placeholder="Search stages, hosts, topics…"
                    value={query}
                    onChange={(e) => onQuery(e.target.value)}
                    aria-label="Search stages"
                />
            </label>

            <div className="mf-stage-toolbar__filters" role="group" aria-label="Filter stages">
                <IconFilter className="mf-stage-toolbar__filters-glyph" aria-hidden />
                {filters.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        className={`mf-stage-chip ${filter === f.key ? 'is-active' : ''}`.trim()}
                        aria-pressed={filter === f.key}
                        onClick={() => onFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="mf-stage-toolbar__sort" role="group" aria-label="Sort stages">
                <IconSort className="mf-stage-toolbar__sort-glyph" aria-hidden />
                {sorts.map((s) => (
                    <button
                        key={s.key}
                        type="button"
                        className={`mf-stage-chip mf-stage-chip--sort ${sort === s.key ? 'is-active' : ''}`.trim()}
                        aria-pressed={sort === s.key}
                        onClick={() => onSort(s.key)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
