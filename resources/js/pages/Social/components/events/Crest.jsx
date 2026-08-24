/**
 * Club crest with an initials fallback. Shared by the fixture-derived templates
 * (live match, tournament) where the crest carries the identity of the card.
 */
export default function Crest({ club, size = 'md' }) {
    const label = (club?.short || club?.name || '?').slice(0, 3).toUpperCase();

    return (
        <span className={`mf-ev-crest mf-ev-crest--${size}`} title={club?.name || undefined}>
            {club?.logo_url ? (
                <img src={club.logo_url} alt={club.name || ''} loading="lazy" />
            ) : (
                <span className="mf-ev-crest__fallback" aria-hidden>{label}</span>
            )}
        </span>
    );
}
