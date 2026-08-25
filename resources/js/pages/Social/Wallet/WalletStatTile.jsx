/**
 * A single wallet stat tile: accent icon chip, large value + label, optional
 * hint line.
 */
export default function WalletStatTile({ value, label, hint = null, icon = null }) {
    const display = typeof value === 'number' ? value.toLocaleString() : value;

    return (
        <div className="mf-wallet-stat">
            {icon ? (
                <span className="mf-wallet-stat__icon" aria-hidden>
                    {icon}
                </span>
            ) : null}
            <span className="mf-wallet-stat__value mf-display">{display}</span>
            <span className="mf-wallet-stat__label mf-text-micro">{label}</span>
            {hint ? <span className="mf-wallet-stat__hint mf-text-micro">{hint}</span> : null}
        </div>
    );
}
