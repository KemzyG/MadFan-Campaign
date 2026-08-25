import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PassportQrCode from '../../Components/Fan/PassportQrCode';
import SocialShell from '../../Layouts/SocialShell';
import FanCollections from './components/FanCollections';
import { PassportSkeleton } from './components/Skeletons';

function initials(name) {
    if (!name) {
        return '?';
    }

    const parts = String(name).trim().split(/\s+/).slice(0, 2);

    return parts.map((part) => part.slice(0, 1).toUpperCase()).join('') || '?';
}

function mrzHandle(handle) {
    return String(handle || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 14);
}

function mrzFanId(fanId) {
    return String(fanId || '')
        .replace(/[^A-Z0-9]/gi, '')
        .slice(0, 18);
}

function formatShortDate(iso) {
    if (!iso) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            year: '2-digit',
            month: 'short',
            day: 'numeric',
        }).format(new Date(iso));
    } catch {
        return '—';
    }
}

function shortEarnLabel(rule) {
    const map = {
        social_post: 'Post',
        social_reply: 'Reply',
        social_like_received: 'Like in',
    };

    return map[rule.source] || rule.label || rule.source;
}

function tierProgress(loyalty) {
    const points = Number(loyalty?.points ?? 0);
    const tierMin = Number(loyalty?.tier?.min_points ?? 0);
    const nextMin = loyalty?.next_tier?.min_points;
    const tierName = loyalty?.tier?.name || 'Core Fan';
    const tierCode = loyalty?.tier?.code || null;

    if (nextMin == null || Number(nextMin) <= tierMin) {
        return {
            percent: 100,
            label: 'Max tier',
            needed: 0,
            tierName,
            tierCode,
            capped: true,
        };
    }

    const span = Number(nextMin) - tierMin;
    const percent = span > 0 ? Math.min(100, Math.max(0, Math.round(((points - tierMin) / span) * 100))) : 100;

    return {
        percent,
        label: loyalty.next_tier.name,
        needed: Number(loyalty.next_tier.points_needed ?? 0),
        tierName,
        tierCode,
        capped: false,
    };
}

function humanizeSource(sourceType) {
    return String(sourceType || '')
        .replace(/^social_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Points';
}

function formatRelative(iso) {
    if (!iso) {
        return '';
    }

    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) {
        return '';
    }

    const diffMinutes = Math.round((Date.now() - then) / 60000);
    if (diffMinutes < 1) {
        return 'now';
    }
    if (diffMinutes < 60) {
        return `${diffMinutes}m`;
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours}h`;
    }
    const diffDays = Math.round(diffHours / 24);

    return `${diffDays}d`;
}

export default function Passport({
    identity,
    loyalty,
    records,
    passport,
    season,
    brand,
    club_contribution: clubContribution,
    collections,
    activity,
}) {
    const page = usePage();
    const [flipped, setFlipped] = useState(false);
    const logoUrl = brand?.logo_url || page.props.app?.logo_url || null;
    const qrPayload =
        passport?.qr_payload || passport?.referral_link || (identity?.fan_id ? `/r/${identity.fan_id}` : '');

    if (identity == null || loyalty == null) {
        return (
            <SocialShell title="Passport">
                <Head title="Passport" />
                <PassportSkeleton />
            </SocialShell>
        );
    }

    function toggleFlip() {
        setFlipped((value) => !value);
    }

    function onKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleFlip();
        }
    }

    const recentActivity = activity ?? [];

    const recordItems = [
        ['Posts', records?.posts ?? 0],
        ['Replies', records?.replies ?? 0],
        ['Likes↓', records?.likes_received ?? 0],
        ['Likes↑', records?.likes_given ?? 0],
        ['Followers', records?.followers ?? 0],
        ['Following', records?.following ?? 0],
    ];

    const earnRules = (loyalty.earn_rules || []).slice(0, 3);
    const seasonCode = season?.code || 'MF';
    const memberNo = identity?.member_no || identity?.fan_id;
    const progress = tierProgress(loyalty);
    const contribution = clubContribution || {
        club_name: identity?.club?.name,
        social_points: loyalty?.social_points_earned ?? 0,
        total_points: loyalty?.points ?? 0,
        share_percent: 0,
        posts: records?.posts ?? 0,
        replies: records?.replies ?? 0,
    };

    const biometrics = [
        ['NAT', identity?.country || '—'],
        ['ISSUED', formatShortDate(passport?.issued_at)],
        ['SEASON', seasonCode],
    ];

    return (
        <SocialShell title="Passport">
            <Head title="Passport" />

            <div className="mf-page">
                <div className="mf-passport-stage">
                    <div className="mf-passport-deck">
                        <div
                            className={`mf-passport-card ${flipped ? 'is-flipped' : ''}`}
                            role="button"
                            tabIndex={0}
                            aria-pressed={flipped}
                            aria-label={flipped ? 'Show passport cover' : 'Show passport records'}
                            onClick={toggleFlip}
                            onKeyDown={onKeyDown}
                        >
                            <div className="mf-passport-inner">
                                {/* —— FRONT: stadium accreditation —— */}
                                <div className="mf-passport-face mf-passport-face--front">
                                    <div className="mf-passport-edge" aria-hidden />

                                    <div className="mf-pass-mast">
                                        <span className="mf-pass-mast-brand">
                                            {logoUrl ? (
                                                <img
                                                    src={logoUrl}
                                                    alt=""
                                                    className="mf-pass-mast-logo"
                                                    width={18}
                                                    height={18}
                                                    decoding="async"
                                                />
                                            ) : (
                                                <span className="mf-pass-mast-dot" aria-hidden />
                                            )}
                                            <span className="mf-display">MAD FAN</span>
                                            <span className="mf-pass-mast-divider" aria-hidden />
                                            <span className="mf-pass-mast-doc">Fan passport</span>
                                        </span>
                                        <span className="mf-mono mf-pass-mast-meta">PASS · {seasonCode}</span>
                                    </div>

                                    <div className="mf-pass-front">
                                        <div className="mf-pass-photo" aria-hidden={!identity.avatar_url}>
                                            {identity.avatar_url ? (
                                                <img
                                                    src={identity.avatar_url}
                                                    alt=""
                                                    className="mf-pass-photo-img"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <span className="mf-display mf-pass-photo-mark">
                                                    {initials(identity.name)}
                                                </span>
                                            )}
                                            <span className="mf-pass-photo-tag">Photo</span>
                                        </div>

                                        <div className="mf-pass-id">
                                            <div className="mf-pass-id-top">
                                                <div className="mf-pass-id-who">
                                                    <p className="mf-display mf-pass-name">{identity.name}</p>
                                                    <p className="mf-pass-subline">
                                                        <span className="mf-mono mf-pass-handle">@{identity.handle}</span>
                                                        <span className="mf-pass-subline-sep" aria-hidden>
                                                            ·
                                                        </span>
                                                        <span className="mf-mono mf-pass-member">No. {memberNo}</span>
                                                    </p>
                                                </div>
                                                <div className="mf-pass-id-score">
                                                    <p className="mf-score mf-pass-score">{loyalty.points}</p>
                                                    <span className="mf-pass-score-unit">PTS</span>
                                                </div>
                                            </div>

                                            <div className="mf-pass-bio">
                                                {biometrics.map(([label, value]) => (
                                                    <div key={label} className="mf-pass-cell">
                                                        <span className="mf-pass-cell-k">{label}</span>
                                                        <span className="mf-mono mf-pass-cell-v">{value}</span>
                                                    </div>
                                                ))}
                                                <div className="mf-pass-cell">
                                                    <span className="mf-pass-cell-k">Tier</span>
                                                    <span className="mf-pass-cell-v mf-pass-cell-v--tier">
                                                        {progress.tierName}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mf-pass-rank">
                                                <div
                                                    className="mf-pass-meter"
                                                    role="progressbar"
                                                    aria-valuenow={progress.percent}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                    aria-label={`Tier progress ${progress.percent}%`}
                                                >
                                                    <span style={{ width: `${progress.percent}%` }} />
                                                </div>
                                                <p className="mf-mono mf-pass-rank-meta">
                                                    <span>{progress.percent}%</span>
                                                    <span aria-hidden>·</span>
                                                    <span>
                                                        {progress.capped
                                                            ? progress.label
                                                            : `${progress.needed} to ${progress.label}`}
                                                    </span>
                                                    <span aria-hidden>·</span>
                                                    <span>
                                                        {loyalty.social_points_earned ?? 0}s/
                                                        {loyalty.campaign_points ?? 0}c
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mf-pass-allegiance">
                                            <div className="mf-pass-club">
                                                {identity.club?.logo_url ? (
                                                    <img
                                                        src={identity.club.logo_url}
                                                        alt=""
                                                        className="mf-pass-club-logo"
                                                        width={24}
                                                        height={24}
                                                        decoding="async"
                                                    />
                                                ) : (
                                                    <span className="mf-pass-club-mark">
                                                        {(identity.club?.short || identity.club?.name || '?')
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </span>
                                                )}
                                                <div className="mf-pass-club-copy">
                                                    <p className="mf-pass-club-name">
                                                        {identity.club?.name || 'No club'}
                                                    </p>
                                                    <p className="mf-pass-club-league">
                                                        {identity.club?.league || 'Pending affiliation'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mf-pass-pips">
                                                <span className="mf-pass-pip mf-pass-pip--hot">{loyalty.streak_days}d</span>
                                                <span className="mf-pass-pip">b{loyalty.best_streak_days || 0}</span>
                                                <span className="mf-mono mf-pass-pip">{records?.posts ?? 0}p</span>
                                                <span className="mf-mono mf-pass-pip">{loyalty.social_points_earned}s</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mf-pass-mrz" aria-hidden>
                                        <span>
                                            {`MF<${mrzHandle(identity.handle)}<<${String(seasonCode)
                                                .toUpperCase()
                                                .replace(/[^A-Z0-9]/g, '')}<`}
                                        </span>
                                        <span>{mrzFanId(memberNo)}</span>
                                    </div>
                                </div>

                                {/* —— BACK: match records + referral —— */}
                                <div className="mf-passport-face mf-passport-face--back">
                                    <div className="mf-passport-edge" aria-hidden />

                                    <div className="mf-pass-mast mf-pass-mast--back">
                                        <span className="mf-pass-mast-brand">
                                            {logoUrl ? (
                                                <img
                                                    src={logoUrl}
                                                    alt=""
                                                    className="mf-pass-mast-logo"
                                                    width={18}
                                                    height={18}
                                                    decoding="async"
                                                />
                                            ) : (
                                                <span className="mf-pass-mast-dot" aria-hidden />
                                            )}
                                            <span className="mf-display">MAD FAN</span>
                                            <span className="mf-pass-mast-divider" aria-hidden />
                                            <span className="mf-pass-mast-doc">Match records</span>
                                        </span>
                                        <span className="mf-mono mf-pass-mast-meta">P02 · {seasonCode}</span>
                                    </div>

                                    <div className="mf-pass-back">
                                        <div className="mf-pass-stats">
                                            {recordItems.map(([label, value]) => (
                                                <div key={label} className="mf-pass-stat">
                                                    <p className="mf-mono mf-pass-stat-v">{value}</p>
                                                    <p className="mf-pass-stat-k">{label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mf-pass-contrib">
                                            <div className="mf-pass-contrib-row">
                                                <span className="truncate">{contribution.club_name || 'Club'}</span>
                                                <span className="mf-mono mf-pass-contrib-pct">
                                                    {contribution.share_percent}% terrace
                                                </span>
                                            </div>
                                            <div className="mf-pass-meter mf-pass-meter--wide" aria-hidden>
                                                <span
                                                    style={{
                                                        width: `${Math.min(100, contribution.share_percent || 0)}%`,
                                                    }}
                                                />
                                            </div>
                                            <p className="mf-mono mf-pass-contrib-meta">
                                                {contribution.social_points}/{contribution.total_points} pts ·{' '}
                                                {contribution.posts}p/{contribution.replies}r · campaign{' '}
                                                {loyalty.campaign_points ?? 0}
                                            </p>
                                        </div>

                                        <div className="mf-pass-bottom">
                                            <div className="mf-pass-earn-panel">
                                                <p className="mf-pass-section-k">Earn rules</p>
                                                <ul className="mf-pass-earn">
                                                    {earnRules.map((rule) => (
                                                        <li key={rule.source}>
                                                            <span className="truncate">
                                                                {shortEarnLabel(rule)}
                                                                <span className="text-[var(--mf-muted)]">
                                                                    {' '}
                                                                    ·{rule.cap}/d
                                                                </span>
                                                            </span>
                                                            <span className="mf-mono text-[var(--mf-pitch)]">
                                                                +{rule.points}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <p className="mf-pass-foot-note">
                                                    {memberNo} · {loyalty.tier?.name || 'Core Fan'}
                                                </p>
                                            </div>

                                            <div className="mf-pass-qr-panel">
                                                <PassportQrCode
                                                    value={qrPayload}
                                                    size={72}
                                                    className="mf-pass-qr"
                                                    title="Referral QR code"
                                                />
                                                <p className="mf-mono mf-pass-qr-cap">Scan to refer</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mf-pass-collections">
                        {recentActivity.length > 0 ? (
                            <section className="mf-pass-collection">
                                <div className="mf-pass-collection__head">
                                    <h2 className="mf-pass-collection__title">Recent activity</h2>
                                </div>
                                <ul className="mf-pass-timeline">
                                    {recentActivity.map((item) => (
                                        <li key={item.id} className="mf-pass-timeline__row">
                                            <span className={`mf-pass-timeline__dot${item.is_social ? ' is-social' : ''}`} aria-hidden />
                                            <span className="mf-pass-timeline__reason truncate">
                                                {item.reason || humanizeSource(item.source_type)}
                                            </span>
                                            <span className="mf-pass-timeline__amount">
                                                {item.amount > 0 ? '+' : ''}
                                                {item.amount}
                                            </span>
                                            <span className="mf-pass-timeline__when">{formatRelative(item.created_at)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}

                        <p className="mf-pass-collections__kicker">Collections</p>

                        <FanCollections collections={collections} />
                    </div>
                </div>
            </div>
        </SocialShell>
    );
}
