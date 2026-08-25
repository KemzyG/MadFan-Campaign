function formatWhen(iso) {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Recent point-ledger feed: what changed, by how much, and the running balance.
 */
export default function WalletActivityList({ activity = [] }) {
    return (
        <section className="mf-wallet-activity" aria-label="Recent activity">
            <h2 className="mf-wallet-section__title mf-text-meta">Recent activity</h2>

            {activity.length === 0 ? (
                <p className="mf-empty">No point activity yet.</p>
            ) : (
                <ul className="mf-wallet-activity__list">
                    {activity.map((item) => {
                        const positive = item.amount >= 0;

                        return (
                            <li key={item.id} className="mf-wallet-activity__row">
                                <span className={`mf-wallet-activity__dot${item.is_social ? ' is-social' : ''}`} aria-hidden />
                                <span className="mf-wallet-activity__copy">
                                    <span className="mf-wallet-activity__reason">
                                        {item.reason || item.source_type}
                                    </span>
                                    <span className="mf-wallet-activity__when mf-text-micro">
                                        {formatWhen(item.created_at)}
                                    </span>
                                </span>
                                <span className="mf-wallet-activity__nums">
                                    <span
                                        className={`mf-wallet-activity__amount mf-mono${positive ? ' is-positive' : ' is-negative'}`}
                                    >
                                        {positive ? '+' : ''}
                                        {item.amount.toLocaleString()}
                                    </span>
                                    <span className="mf-wallet-activity__balance mf-text-micro mf-mono">
                                        {item.balance_after.toLocaleString()}
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
