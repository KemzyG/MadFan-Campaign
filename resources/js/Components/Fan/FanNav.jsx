import { Link, usePage } from '@inertiajs/react';

const links = [
    { href: '/dashboard', label: 'DASHBOARD' },
    { href: '/daily-claim', label: 'CLAIM' },
    { href: '/tasks', label: 'TASKS' },
    { href: '/passport', label: 'PASSPORT' },
    { href: '/', label: 'HOME' },
];

export default function FanNav() {
    const { url } = usePage();

    return (
        <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="pts-pill"
                    style={{
                        textDecoration: 'none',
                        borderColor: url === link.href || (link.href !== '/' && url.startsWith(link.href))
                            ? 'var(--flame)'
                            : undefined,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                            letterSpacing: '2px',
                            color: 'var(--muted)',
                        }}
                    >
                        {link.label}
                    </span>
                </Link>
            ))}
        </nav>
    );
}
