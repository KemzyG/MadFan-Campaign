import { Link, usePage } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { socialApi } from '../../../lib/socialApi';

/**
 * Fan search — find anyone by name or @username/handle, not just people
 * already followed (that's FollowController::following, used by the chat
 * "new conversation" picker instead).
 */
export default function UserSearch({ open, onClose }) {
    const titleId = useId();
    const inputRef = useRef(null);
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
            return undefined;
        }

        inputRef.current?.focus();

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose?.();
            }
        }

        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    useEffect(() => {
        const term = query.trim();

        if (!open || term === '') {
            setResults([]);
            setLoading(false);
            return undefined;
        }

        let cancelled = false;
        setLoading(true);

        const timer = window.setTimeout(() => {
            socialApi(`/users/search?q=${encodeURIComponent(term)}`)
                .then((data) => {
                    if (!cancelled) {
                        setResults(data?.data || []);
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        setResults([]);
                    }
                })
                .finally(() => {
                    if (!cancelled) {
                        setLoading(false);
                    }
                });
        }, 280);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [query, open]);

    if (!open) {
        return null;
    }

    const term = query.trim();

    return (
        <div className="mf-usersearch-modal" role="presentation">
            <button
                type="button"
                className="mf-usersearch-modal__backdrop"
                aria-label="Close search"
                onClick={onClose}
            />
            <div className="mf-usersearch-modal__panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="mf-usersearch-modal__head">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                        <circle cx="11" cy="11" r="6.5" strokeWidth="1.75" />
                        <path strokeLinecap="round" strokeWidth="1.75" d="m16 16 3.5 3.5" />
                    </svg>
                    <input
                        ref={inputRef}
                        id={titleId}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search fans by name or @username"
                        autoComplete="off"
                    />
                    <button type="button" className="mf-usersearch-modal__close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="mf-usersearch-modal__body">
                    {loading ? (
                        <p className="mf-usersearch-modal__hint mf-text-meta">Searching…</p>
                    ) : term === '' ? (
                        <p className="mf-usersearch-modal__hint mf-text-meta">
                            Type a name or @username to find fans.
                        </p>
                    ) : results.length === 0 ? (
                        <p className="mf-usersearch-modal__hint mf-text-meta">No fans match “{term}”.</p>
                    ) : (
                        <ul className="mf-usersearch-modal__list">
                            {results.map((user) => (
                                <li key={user.id}>
                                    <Link href={`/social/u/${user.handle}`} onClick={onClose}>
                                        <span className="mf-usersearch-modal__avatar">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt=""
                                                    onError={(event) => onImageError(event, fallbackUrl)}
                                                />
                                            ) : (
                                                <span aria-hidden>{(user.name || '?').slice(0, 1).toUpperCase()}</span>
                                            )}
                                        </span>
                                        <span className="mf-usersearch-modal__who min-w-0">
                                            <span className="mf-usersearch-modal__name truncate">{user.name}</span>
                                            <span className="mf-text-meta text-[var(--mf-muted)] truncate">
                                                @{user.handle}
                                            </span>
                                        </span>
                                        {user.is_following ? (
                                            <span className="mf-usersearch-modal__tag">Following</span>
                                        ) : null}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
