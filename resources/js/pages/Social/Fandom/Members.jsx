import { Head, Link, usePage } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

export default function FandomMembers({ fandom, members }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const rows = members?.data ?? [];

    return (
        <SocialShell title="Fandom members" backHref={`/social/fandom/${fandom.slug}`}>
            <Head title={`${fandom.name} members`} />

            <div className="mf-page mf-fh">
                <header className="mf-fh-section">
                    <h1 className="mf-fh-section__title">{fandom.name} fans</h1>
                    <p className="mf-text-meta">{members?.meta?.total ?? 0} members</p>
                </header>

                <ul className="mf-fh-members-list">
                    {rows.map((member) => (
                        <li key={member.id}>
                            <Link href={`/social/u/${member.handle}`} className="mf-fh-member-row">
                                <span className="mf-fh-member-row__avatar">
                                    {member.avatar_url ? (
                                        <img
                                            src={member.avatar_url}
                                            alt=""
                                            onError={(event) => onImageError(event, fallbackUrl)}
                                        />
                                    ) : (
                                        <span aria-hidden>{(member.name || '?').slice(0, 1).toUpperCase()}</span>
                                    )}
                                </span>
                                <span className="mf-fh-member-row__name truncate">{member.name}</span>
                                <span className="mf-mono mf-fh-member-row__points">
                                    {member.total_points.toLocaleString()} pts
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                {members?.meta?.last_page > 1 ? (
                    <div className="mf-fh-members-pager">
                        {members.meta.current_page > 1 ? (
                            <Link
                                href={`/social/fandom/${fandom.slug}/members?page=${members.meta.current_page - 1}`}
                                className="mf-btn mf-btn--ghost"
                            >
                                ← Prev
                            </Link>
                        ) : null}
                        {members.meta.current_page < members.meta.last_page ? (
                            <Link
                                href={`/social/fandom/${fandom.slug}/members?page=${members.meta.current_page + 1}`}
                                className="mf-btn mf-btn--ghost"
                            >
                                Next →
                            </Link>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </SocialShell>
    );
}
