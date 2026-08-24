/**
 * Read-only "with @a, @b +N" line shown inside a rendered post when the author
 * tagged people. Names only — no remove control (that lives in the composer).
 *
 * @param {{ tagged: Array<{id:number,name:string,handle?:string}> }} props
 */
export default function TaggedRow({ tagged }) {
    if (!tagged || tagged.length === 0) {
        return null;
    }

    const shown = tagged.slice(0, 2);
    const extra = tagged.length - shown.length;

    return (
        <p className="mf-tagrow">
            <span className="mf-tagrow__lead">with</span>
            {shown.map((user, index) => (
                <span key={user.id} className="mf-tagrow__name">
                    {user.handle ? `@${user.handle}` : user.name}
                    {index < shown.length - 1 ? ',' : ''}
                </span>
            ))}
            {extra > 0 ? <span className="mf-tagrow__more"> +{extra}</span> : null}
        </p>
    );
}
