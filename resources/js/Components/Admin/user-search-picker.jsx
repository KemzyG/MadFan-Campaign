import { useEffect, useRef, useState } from 'react';
import { Input } from '@/Components/ui/input';
import { adminApi } from '../../lib/api';

/**
 * Search-and-confirm fan picker — type an email, name, or username, pick the
 * right person from the results, and the selected fan is shown back (name +
 * email + handle) so there's no way to submit the wrong user id by mistake.
 */
export default function UserSearchPicker({ label, value, onChange, required = false, placeholder = 'Search by email, name, or username…' }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setLoading(false);
            return undefined;
        }

        setLoading(true);
        const timer = setTimeout(() => {
            adminApi(`/users?search=${encodeURIComponent(trimmed)}&per_page=8`)
                .then((data) => setResults(data?.data ?? []))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        function onClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    function select(user) {
        onChange(user);
        setQuery('');
        setResults([]);
        setOpen(false);
    }

    function clear() {
        onChange(null);
        setQuery('');
    }

    return (
        <div ref={containerRef} className="relative">
            {label ? <div className="mb-1.5 text-sm font-medium">{label}</div> : null}

            {value ? (
                <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                    <div className="min-w-0">
                        <div className="truncate font-medium">{value.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                            {value.email}
                            {value.handle ? ` · @${value.handle}` : ''}
                        </div>
                    </div>
                    <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground" onClick={clear}>
                        Change
                    </button>
                </div>
            ) : (
                <>
                    <Input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        required={required}
                        autoComplete="off"
                    />
                    {open && query.trim().length > 0 ? (
                        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                            {loading ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
                            ) : results.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">No fans found.</div>
                            ) : (
                                results.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                                        onClick={() => select(user)}
                                    >
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {user.email}
                                            {user.handle ? ` · @${user.handle}` : ''}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
}
