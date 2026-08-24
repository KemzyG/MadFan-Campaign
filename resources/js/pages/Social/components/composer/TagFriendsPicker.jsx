import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { socialApi } from '../../../../lib/socialApi';
import { IconClose, IconUserPlus } from '../post/icons';

/**
 * Modal picker for tagging people you follow. Fetches the viewer's following
 * list (search-filtered) from the Social JSON API and toggles a selection set.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   selected: Array<{id:number,name:string,handle?:string,avatar_url?:string}>,
 *   onChange: (next:Array<object>) => void,
 *   max?: number,
 * }} props
 */
export default function TagFriendsPicker({ open, onClose, selected, onChange, max = 10 }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const selectedIds = useMemo(() => new Set(selected.map((user) => user.id)), [selected]);
    const atLimit = selected.length >= max;

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        let active = true;
        setLoading(true);
        setError(null);

        const timer = setTimeout(() => {
            socialApi(`/following?q=${encodeURIComponent(query.trim())}`)
                .then((data) => {
                    if (active) {
                        setResults(Array.isArray(data.data) ? data.data : []);
                    }
                })
                .catch((err) => {
                    if (active) {
                        setResults([]);
                        setError(err?.message || 'Could not load your following list.');
                    }
                })
                .finally(() => {
                    if (active) {
                        setLoading(false);
                    }
                });
        }, 220);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [open, query]);

    if (!open) {
        return null;
    }

    function toggle(user) {
        if (selectedIds.has(user.id)) {
            onChange(selected.filter((entry) => entry.id !== user.id));
            return;
        }

        if (atLimit) {
            return;
        }

        onChange([...selected, user]);
    }

    return createPortal(
        <div className="mf-sheet" role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close" onClick={onClose} />
            <div className="mf-sheet__panel mf-tagpick" role="dialog" aria-modal="true" aria-label="Tag friends">
                <div className="mf-sheet__handle" aria-hidden />

                <div className="mf-sheet__head">
                    <p className="mf-display mf-text-title tracking-[0.03em]">
                        Tag friends
                        {selected.length > 0 ? (
                            <span className="mf-tagpick__count mf-mono"> {selected.length}/{max}</span>
                        ) : null}
                    </p>
                    <button type="button" className="mf-stage-icon-btn" aria-label="Done" title="Done" onClick={onClose}>
                        <IconClose />
                    </button>
                </div>

                <input
                    type="search"
                    className="mf-tagpick__search"
                    placeholder="Search people you follow"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    autoFocus
                />

                <div className="mf-tagpick__list">
                    {loading ? (
                        <p className="mf-tagpick__hint">Loading…</p>
                    ) : error ? (
                        <p className="mf-tagpick__hint">{error}</p>
                    ) : results.length === 0 ? (
                        <p className="mf-tagpick__hint">
                            {query.trim() ? 'No matches in your following.' : 'Follow people to tag them here.'}
                        </p>
                    ) : (
                        results.map((user) => {
                            const isSelected = selectedIds.has(user.id);
                            const disabled = !isSelected && atLimit;

                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={`mf-tagpick__row${isSelected ? ' is-selected' : ''}`}
                                    disabled={disabled}
                                    aria-pressed={isSelected}
                                    onClick={() => toggle(user)}
                                >
                                    <span className="mf-avatar h-9 w-9" aria-hidden>
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" />
                                        ) : (
                                            (user.name || '?').slice(0, 1).toUpperCase()
                                        )}
                                    </span>
                                    <span className="mf-tagpick__who">
                                        <span className="mf-tagpick__name">{user.name}</span>
                                        {user.handle ? <span className="mf-tagpick__handle">@{user.handle}</span> : null}
                                    </span>
                                    <span className={`mf-tagpick__check${isSelected ? ' is-on' : ''}`} aria-hidden>
                                        <IconUserPlus />
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>

                <button type="button" className="mf-btn mf-btn--pitch mf-tagpick__done" onClick={onClose}>
                    Done
                </button>
            </div>
        </div>,
        document.body,
    );
}
