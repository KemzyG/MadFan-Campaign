import { forwardRef } from 'react';

/**
 * All / Sports / Esports / Music / Books — the one filter the whole page
 * hangs off. `groups` already carries which one is active from the server.
 */
const GroupPills = forwardRef(function GroupPills({ groups, onSelect }, ref) {
    return (
        <nav className="mf-fd-pills" aria-label="Fandom groups" ref={ref}>
            {groups.map((group) => (
                <button
                    key={group.key}
                    type="button"
                    className={`mf-fd-pill ${group.active ? 'is-active' : ''}`.trim()}
                    aria-pressed={group.active}
                    onClick={() => onSelect(group.key)}
                >
                    {group.label}
                </button>
            ))}
        </nav>
    );
});

export default GroupPills;
