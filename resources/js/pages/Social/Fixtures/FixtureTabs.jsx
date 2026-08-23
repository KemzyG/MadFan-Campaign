const TABS = [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
    { id: 'today', label: 'Today' },
    { id: 'coming', label: 'Coming' },
    { id: 'past', label: 'Past' },
];

/**
 * Fixture filter tabs with live counts. The parent owns the active tab and the
 * router visit; this just renders and reports selection.
 */
export default function FixtureTabs({ tab, counts, onSelect }) {
    return (
        <div className="mf-fixture-tabs" role="tablist" aria-label="Fixture filters">
            {TABS.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    className={tab === item.id ? 'is-active' : ''}
                    onClick={() => onSelect(item.id)}
                >
                    {item.label}
                    <span className="mf-mono">{counts[item.id] ?? 0}</span>
                </button>
            ))}
        </div>
    );
}

export { TABS };
