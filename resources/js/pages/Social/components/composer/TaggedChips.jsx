import { IconClose } from '../post/icons';

/**
 * Chip row of tagged people shown under the composer body. Each chip removes
 * itself; nothing renders when no one is tagged.
 *
 * @param {{
 *   tagged: Array<{id:number,name:string,handle?:string,avatar_url?:string}>,
 *   onRemove: (id:number) => void,
 * }} props
 */
export default function TaggedChips({ tagged, onRemove }) {
    if (!tagged || tagged.length === 0) {
        return null;
    }

    return (
        <div className="mf-tagged" aria-label="Tagged people">
            <span className="mf-tagged__lead">with</span>
            {tagged.map((user) => (
                <span key={user.id} className="mf-tagged__chip">
                    <span className="mf-avatar h-5 w-5" aria-hidden>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" />
                        ) : (
                            (user.name || '?').slice(0, 1).toUpperCase()
                        )}
                    </span>
                    <span className="mf-tagged__name">{user.handle ? `@${user.handle}` : user.name}</span>
                    <button
                        type="button"
                        className="mf-tagged__x"
                        aria-label={`Remove ${user.name}`}
                        onClick={() => onRemove(user.id)}
                    >
                        <IconClose />
                    </button>
                </span>
            ))}
        </div>
    );
}
