import FixtureRow from './FixtureRow';

function Section({ id, title, count, empty, children }) {
    return (
        <section className="mf-fixture-section" aria-labelledby={`fx-${id}`}>
            <header className="mf-fixture-section__head">
                <h2 id={`fx-${id}`} className="mf-fixture-section__title">{title}</h2>
                <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{count}</span>
            </header>
            {count === 0 ? (
                <p className="mf-fixture-empty mf-text-meta text-[var(--mf-muted)]">{empty}</p>
            ) : (
                children
            )}
        </section>
    );
}

function List({ matches = [], selectedId, onSelect }) {
    return (
        <div className="mf-fixture-rows">
            {matches.map((match) => (
                <FixtureRow
                    key={match.id}
                    match={match}
                    selected={String(match.id) === String(selectedId)}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}

/**
 * The master pane list: fixtures grouped into Live / Today / Coming / Past,
 * filtered by the active tab. Each row is selectable.
 */
export default function FixtureGroups({ board, tab, counts, selectedId, onSelect }) {
    const showLive = tab === 'all' || tab === 'live';
    const showToday = tab === 'all' || tab === 'today';
    const showComing = tab === 'all' || tab === 'coming';
    const showPast = tab === 'all' || tab === 'past';

    return (
        <div className="mf-fixture-groups">
            {showLive ? (
                <Section id="live" title="Live" count={counts.live} empty="No matches live right now.">
                    <List matches={board.live} selectedId={selectedId} onSelect={onSelect} />
                </Section>
            ) : null}

            {showToday ? (
                <Section id="today" title="Today" count={counts.today} empty="No more kickoffs today.">
                    <List matches={board.today} selectedId={selectedId} onSelect={onSelect} />
                </Section>
            ) : null}

            {showComing ? (
                <Section
                    id="coming"
                    title="Coming days"
                    count={counts.coming}
                    empty="No upcoming fixtures on the board."
                >
                    <div className="mf-fixture-days">
                        {(board.coming || []).map((day) => (
                            <div key={day.date} className="mf-fixture-day">
                                <h3 className="mf-fixture-day__label">{day.label}</h3>
                                <List matches={day.matches} selectedId={selectedId} onSelect={onSelect} />
                            </div>
                        ))}
                    </div>
                </Section>
            ) : null}

            {showPast ? (
                <Section id="past" title="Past" count={counts.past} empty="No finished matches yet.">
                    <List matches={board.past} selectedId={selectedId} onSelect={onSelect} />
                </Section>
            ) : null}
        </div>
    );
}
