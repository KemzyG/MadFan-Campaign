/**
 * Overlapping circular avatars (up to `max`) with a trailing "+N" bubble when
 * the crowd exceeds what's shown. Matches the carousel in the feed stage card.
 *
 * @param {{
 *   people: Array<{id:number,name?:string,avatar_url?:string}>,
 *   overflow?: number,
 *   max?: number,
 * }} props
 */
export default function AvatarStack({ people, overflow = 0, max = 4 }) {
    const shown = (people || []).slice(0, max);

    if (shown.length === 0 && overflow <= 0) {
        return null;
    }

    return (
        <div className="mf-avstack" aria-hidden>
            {shown.map((person, index) => (
                <span key={person.id ?? index} className="mf-avstack__item" style={{ zIndex: shown.length - index }}>
                    <span className="mf-avatar h-8 w-8">
                        {person.avatar_url ? (
                            <img src={person.avatar_url} alt="" loading="lazy" />
                        ) : (
                            (person.name || '?').slice(0, 1).toUpperCase()
                        )}
                    </span>
                </span>
            ))}
            {overflow > 0 ? (
                <span className="mf-avstack__item mf-avstack__more" style={{ zIndex: 0 }}>
                    +{overflow}
                </span>
            ) : null}
        </div>
    );
}
