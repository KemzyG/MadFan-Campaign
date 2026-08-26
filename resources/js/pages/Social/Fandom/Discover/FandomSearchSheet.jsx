import { Link } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import { socialApi } from '../../../../lib/socialApi';
import { IconClose, IconSearch } from './icons';

/**
 * Overlay search across both fandoms and their subsets, debounced the same
 * way UserSearch does for fan search.
 */
export default function FandomSearchSheet({ open, onClose }) {
    const titleId = useId();
    const inputRef = useRef(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ fandoms: [], subsets: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults({ fandoms: [], subsets: [] });
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
            setResults({ fandoms: [], subsets: [] });
            setLoading(false);
            return undefined;
        }

        let cancelled = false;
        setLoading(true);

        const timer = window.setTimeout(() => {
            socialApi(`/fandom/search?q=${encodeURIComponent(term)}`)
                .then((data) => {
                    if (!cancelled) {
                        setResults({ fandoms: data.fandoms ?? [], subsets: data.subsets ?? [] });
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        setResults({ fandoms: [], subsets: [] });
                    }
                })
                .finally(() => {
                    if (!cancelled) {
                        setLoading(false);
                    }
                });
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [query, open]);

    if (!open) {
        return null;
    }

    const hasResults = results.fandoms.length > 0 || results.subsets.length > 0;

    return (
        <div className="mf-fd-search" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="mf-fd-search__panel">
                <div className="mf-fd-search__head">
                    <IconSearch className="mf-fd-search__glyph" />
                    <input
                        ref={inputRef}
                        id={titleId}
                        type="search"
                        className="mf-fd-search__input"
                        placeholder="Search fandoms, leagues, games…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="button" className="mf-fd-header__icon-btn" aria-label="Close search" onClick={onClose}>
                        <IconClose />
                    </button>
                </div>

                <div className="mf-fd-search__results">
                    {loading ? <p className="mf-fd-search__hint mf-text-meta">Searching…</p> : null}

                    {!loading && query.trim() !== '' && !hasResults ? (
                        <p className="mf-fd-search__hint mf-text-meta">Nothing matches "{query.trim()}".</p>
                    ) : null}

                    {results.fandoms.length > 0 ? (
                        <ul className="mf-fd-search__list">
                            {results.fandoms.map((fandom) => (
                                <li key={`fandom-${fandom.id}`}>
                                    <Link
                                        href={`/social/fandom/${fandom.slug}`}
                                        className="mf-fd-search__row"
                                        onClick={onClose}
                                    >
                                        <span aria-hidden>{fandom.icon}</span>
                                        <span className="min-w-0">
                                            <span className="mf-fd-search__row-name">{fandom.name}</span>
                                            <span className="mf-text-meta text-[var(--mf-muted)]">Category</span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {results.subsets.length > 0 ? (
                        <ul className="mf-fd-search__list">
                            {results.subsets.map((subset) => (
                                <li key={`subset-${subset.id}`}>
                                    <Link
                                        href={subset.fandom ? `/social/fandom/${subset.fandom.slug}` : '/social/fandom'}
                                        className="mf-fd-search__row"
                                        onClick={onClose}
                                    >
                                        <span aria-hidden>{subset.fandom?.icon ?? '🔥'}</span>
                                        <span className="min-w-0">
                                            <span className="mf-fd-search__row-name">{subset.name}</span>
                                            <span className="mf-text-meta text-[var(--mf-muted)]">
                                                {subset.fandom?.name ?? 'Fandom'}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </div>
            <button type="button" className="mf-fd-search__scrim" aria-label="Close search" onClick={onClose} />
        </div>
    );
}
