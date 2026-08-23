/**
 * Hero balance card: total points, current tier, and progress toward the next.
 */
export default function WalletBalanceCard({ balance }) {
    if (!balance) {
        return null;
    }

    const { total_points: total, total_earned: totalEarned, currency_label: currencyLabel, tier, next_tier: nextTier } = balance;

    return (
        <section className="mf-wallet-balance" aria-label="Points balance">
            <div className="mf-wallet-balance__head">
                <span className="mf-wallet-balance__label mf-text-micro">{currencyLabel}</span>
                {tier ? <span className="mf-wallet-balance__tier">{tier.name}</span> : null}
            </div>

            <p className="mf-wallet-balance__value mf-display">{total.toLocaleString()}</p>

            <p className="mf-wallet-balance__earned mf-text-micro">
                {totalEarned.toLocaleString()} earned all-time
            </p>

            {nextTier ? (
                <div className="mf-wallet-balance__next">
                    <div className="mf-wallet-balance__next-copy mf-text-micro">
                        <span>{nextTier.name}</span>
                        <span className="mf-mono">{nextTier.points_needed.toLocaleString()} to go</span>
                    </div>
                    <div className="mf-wallet-progress" role="progressbar" aria-valuenow={nextTier.progress_percent} aria-valuemin={0} aria-valuemax={100}>
                        <span className="mf-wallet-progress__fill" style={{ width: `${nextTier.progress_percent}%` }} />
                    </div>
                </div>
            ) : (
                <p className="mf-wallet-balance__next-copy mf-text-micro">Top tier reached</p>
            )}
        </section>
    );
}
