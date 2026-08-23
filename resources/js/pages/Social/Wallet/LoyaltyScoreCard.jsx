/**
 * Detailed loyalty-score panel: headline score + grade, and a bar per component
 * (your activity / club form / global standing) with its weight and value.
 * Components flagged unavailable (e.g. no favourite club) are shown muted.
 */
export default function LoyaltyScoreCard({ loyalty }) {
    if (!loyalty) {
        return null;
    }

    const components = Object.values(loyalty.components ?? {});

    return (
        <section className="mf-wallet-loyalty" aria-label="Loyalty score">
            <div className="mf-wallet-loyalty__head">
                <div className="mf-wallet-loyalty__score">
                    <span className="mf-wallet-loyalty__value mf-display">{loyalty.score}</span>
                    <span className="mf-wallet-loyalty__max mf-mono">/ {loyalty.max}</span>
                </div>
                <div className="mf-wallet-loyalty__grade-wrap">
                    <span className="mf-wallet-loyalty__grade mf-display" data-grade={loyalty.grade}>
                        {loyalty.grade}
                    </span>
                    <span className="mf-wallet-loyalty__grade-label mf-text-micro">Loyalty grade</span>
                </div>
            </div>

            <ul className="mf-wallet-loyalty__components">
                {components.map((component) => (
                    <li
                        key={component.key}
                        className={`mf-wallet-loyalty__row${component.available ? '' : ' is-muted'}`}
                    >
                        <div className="mf-wallet-loyalty__row-head mf-text-micro">
                            <span>{component.label}</span>
                            <span className="mf-mono">
                                {component.available ? `${component.value}%` : 'n/a'}
                                <span className="mf-wallet-loyalty__weight"> · {component.weight}% weight</span>
                            </span>
                        </div>
                        <div className="mf-wallet-bar">
                            <span
                                className="mf-wallet-bar__fill"
                                style={{ width: `${component.available ? component.value : 0}%` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
