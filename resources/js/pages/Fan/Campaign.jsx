import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import FanLayout from '../../Layouts/FanLayout';

const WEEKS = [
    { num: 'W1', name: 'Kickoff', desc: 'Sign up, pick your club, complete your profile. 2× point multiplier all week.', active: true },
    { num: 'W2', name: 'Squad Up', desc: 'Refer your first 3 fans. Unlock the referral leaderboard.' },
    { num: 'W3', name: 'Daily Grind', desc: '7 day streak bonus unlocked. Claim every day for a 500pt bonus.' },
    { num: 'W4', name: 'Social Proof', desc: 'Share your Fan Passport. Amplification tasks go live.' },
    { num: 'W5', name: 'Loyalty Test', desc: 'Knowledge challenges and prediction tasks. Prove you\'re a real fan.' },
    { num: 'W6', name: 'Top 100 Race', desc: 'Leaderboard snapshot. Top 100 locked in for exclusive tier rewards.' },
    { num: 'W7', name: 'Final Push', desc: 'Bonus task drops. Referral multiplier increases to 3×.' },
    { num: 'W8', name: 'Judgment Day', desc: 'Final leaderboard. Early access invites sent. Token rewards distributed.' },
];

const EARN_CARDS = [
    {
        icon: '/icons/daily-routine.png',
        iconAlt: 'Daily check-in',
        pts: '+50 to 150 PTS / DAY',
        name: 'Daily Check in',
        desc: 'Claim your daily points. Value increases with streak length: 50 on day 1, up to 150 by day 7.',
    },
    {
        icon: '/icons/friends.png',
        iconAlt: 'Refer a fan',
        pts: '+500 PTS / REFERRAL',
        name: 'Refer a Fan',
        desc: 'Each friend who joins and completes their profile earns you 500 points. No cap on referrals.',
    },
    {
        icon: '/icons/validity.png',
        iconAlt: 'Task completion',
        pts: '+100 to 1000 PTS',
        name: 'Task Completion',
        desc: 'Weekly tasks: follow Mad Fan on X, join the Telegram, share your Fan ID, verify your club.',
    },
    {
        icon: '/icons/010-fire.png',
        iconAlt: '7 day streak',
        pts: '+500 BONUS',
        name: '7 Day Streak',
        desc: 'Complete a full 7 day claim streak. Bonus drops on day 7 and resets the multiplier upward.',
    },
    {
        icon: '/icons/club.png',
        iconAlt: 'Pick your club',
        pts: '+200 PTS',
        name: 'Pick Your Club',
        desc: 'Connect your loyalty to a football club. One time bonus, but your club\'s community can earn together.',
    },
    {
        icon: '/icons/share-arrow.png',
        iconAlt: 'Share your Fan Passport',
        pts: '+300 PTS',
        name: 'Share Your Fan Passport',
        desc: 'Post your Fan Passport card publicly on X or Instagram. Tag @MadFan for verification.',
    },
];

const REF_TIERS = [
    { count: '3', name: 'Fan Rank Badge', desc: 'Exclusive profile badge + 1,500 pts' },
    { count: '10', name: 'Ultra Supporter', desc: 'Priority early access + 5,000 pts' },
    { count: '25', name: 'Loyalty Legend', desc: 'Token allocation + founding member NFT' },
    { count: '50+', name: 'Ambassador Status', desc: 'Revenue share + exclusive IRL access' },
];

const DEMO_DAYS = [
    { label: 'M', pts: 50, claimed: true },
    { label: 'T', pts: 50, claimed: true },
    { label: 'W', pts: 75, claimed: true },
    { label: 'T', pts: 75, claimed: true },
    { label: 'F', pts: 100, today: true },
    { label: 'S', pts: 100 },
    { label: 'S', pts: 150 },
];

function generateFanId() {
    const num = Math.floor(Math.random() * 90000) + 10000;

    return `MF-${num}`;
}

function tierClass(tier) {
    const t = (tier || '').toLowerCase();
    if (t.includes('legend')) {
        return 'legend';
    }
    if (t.includes('ultra')) {
        return 'ultra';
    }

    return 'core';
}

function formatReferralLink(link) {
    if (!link) {
        return 'madfan.io/r/FAN-00000';
    }

    if (link.startsWith('/')) {
        return `madfan.io${link}`;
    }

    try {
        const url = new URL(link);

        return `${url.host}${url.pathname}`;
    } catch {
        return link.replace(/^https?:\/\//, '');
    }
}

export default function Campaign({
    waitlist_count = 0,
    season,
    leaderboard = [],
    viewer = null,
}) {
    const { auth, flash, fanNav } = usePage().props;
    const [displayCount, setDisplayCount] = useState(waitlist_count);
    const [joined, setJoined] = useState(Boolean(auth?.user));
    const [waitlistFanId, setWaitlistFanId] = useState(null);
    const [waitlistPosition, setWaitlistPosition] = useState(null);
    const [dayStates, setDayStates] = useState(DEMO_DAYS);
    const [claimFlash, setClaimFlash] = useState(null);
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const showConfirmed = joined || Boolean(auth?.user) || Boolean(fanNav?.waitlist_email);
    const fanId = viewer?.fan_id ?? auth?.user?.fan_id ?? waitlistFanId;
    const position = viewer?.rank ?? waitlistPosition ?? waitlist_count;
    const referralLink = viewer?.referral_link ?? (fanId ? `/r/${fanId}` : null);
    const streakDays = viewer?.streak_days ?? 4;
    const multiplier = viewer?.multiplier ?? '1.5';
    const tierLabel = viewer?.tier_label ?? 'STARTER TIER';
    const tierProgress = viewer?.tier_progress ?? 12;

    const activeDays = useMemo(() => {
        if (!viewer) {
            return dayStates;
        }

        const claimedCount = Math.min(streakDays, 7);

        return DEMO_DAYS.map((day, index) => ({
            ...day,
            claimed: index < claimedCount,
            today: index === claimedCount && claimedCount < 7,
        }));
    }, [dayStates, streakDays, viewer]);

    useEffect(() => {
        if (fanNav?.waitlist_email && !auth?.user) {
            setJoined(true);
        }
    }, [fanNav?.waitlist_email, auth?.user]);

    useEffect(() => {
        const target = waitlist_count;
        let current = Math.max(0, target - 131);
        const step = () => {
            if (current < target) {
                current += Math.ceil((target - current) / 8);
                setDisplayCount(current);
                requestAnimationFrame(step);
            } else {
                setDisplayCount(target);
            }
        };
        requestAnimationFrame(step);
    }, [waitlist_count]);

    useEffect(() => {
        if (flash?.success) {
            setJoined(true);
            setWaitlistFanId(generateFanId());
            setWaitlistPosition(waitlist_count);
        }
    }, [flash?.success, waitlist_count]);

    function joinWaitlist(e) {
        e.preventDefault();
        post('/waitlist', {
            onSuccess: () => {
                setJoined(true);
                setWaitlistFanId(generateFanId());
                setWaitlistPosition(waitlist_count + 1);
                setDisplayCount(waitlist_count + 1);
            },
        });
    }

    function claimToday(index) {
        if (auth?.user) {
            window.location.href = '/daily-claim';

            return;
        }

        setDayStates((days) =>
            days.map((day, i) => {
                if (i !== index || day.claimed) {
                    return day;
                }

                return { ...day, claimed: true, today: false };
            }),
        );
        setClaimFlash('+100 PTS');
        window.setTimeout(() => setClaimFlash(null), 1300);
    }

    const registerUrl = fanNav?.waitlist_email
        ? `/register?email=${encodeURIComponent(fanNav.waitlist_email)}`
        : '/register';

    return (
        <FanLayout withSidebar={showConfirmed}>
            <Head title="Mad Fan: The Loyalty Layer" />

            <div className="wrap">
                <div className="hero">
                    <div className="hero-eyebrow"> The Loyalty Layer of the Internet</div>
                    <h1>
                        YOUR <span className="accent">LOYALTY</span> FINALLY COUNTS
                    </h1>
                    <p className="hero-sub">
                        The internet measured attention. Now it measures and rewards loyalty. 
                        Season 01 is live to earn points, build your Fan Passport, climb 
                        <strong>  {' '} THE BOARD</strong>, {' '} and unlock early access before the full Loyalty Layer ships.
                    </p>
                </div>
 
                <div className="scoreboard">
                    <div className="score-cell">
                        <div className="score-val">{displayCount.toLocaleString()}</div>
                        <div className="score-label">Fans on waitlist</div>
                    </div>
                    <div className="score-cell">
                        <div className="score-val">{season?.total_weeks ?? 8}</div>
                        <div className="score-label">Weeks of Season 01</div>
                    </div>
                    <div className="score-cell">
                        <div className="score-val">500K</div>
                        <div className="score-label">Points up for grabs</div>
                    </div>
                </div>

                {!showConfirmed && (
                    <div className="signup-block" id="signup-block">
                        <h2>CLAIM YOUR SPOT</h2>
                        <p>Join now. Every day you wait, someone else moves ahead of you.</p>
                        <form onSubmit={joinWaitlist}>
                            <div className="input-row">
                                <input
                                    type="email"
                                    id="email-input"
                                    placeholder="your@email.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn-join" disabled={processing}>
                                    {processing ? 'JOINING…' : 'JOIN NOW'}
                                </button>
                            </div>
                            {errors.email && <p style={{ color: 'var(--ember)', marginTop: '8px' }}>{errors.email}</p>}
                        </form>
                    </div>
                )}

                {showConfirmed && (
                    <div className="confirmed" id="confirmed-block" style={{ display: 'block' }}>
                        <h2>YOU&apos;RE IN THE SQUAD</h2>
                        <p>Your loyalty journey starts now. Complete tasks below to climb the board.</p>
                        {fanId && <div className="fan-id">FAN-ID: {fanId}</div>}
                        <div className="position-badge">#{Number(position).toLocaleString()}</div>
                        <div className="position-label">YOUR CURRENT POSITION</div>
                        <div className="progress-wrap" style={{ maxWidth: '320px', margin: '20px auto 0' }}>
                            <div className="progress-fill" style={{ width: `${tierProgress}%` }} />
                            <div className="progress-label">
                                <span>{tierLabel}</span>
                            </div>
                        </div>
                        <div className="confirmed-actions">
                            {auth?.user ? (
                                <>
                                    <Link href="/tasks" className="btn-join" style={{ textDecoration: 'none' }}>
                                        GO TO TASKS
                                    </Link>
                                    {auth.user.staff_active && (
                                        <Link href="/staff" className="btn-join btn-join--staff" style={{ textDecoration: 'none' }}>
                                            STAFF DASHBOARD
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <Link href={registerUrl} className="btn-join" style={{ textDecoration: 'none' }}>
                                    CREATE YOUR PASSPORT
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <section>
                <div className="wrap">
                    <div className="section-eye">Why Mad Fan</div>
                    <div className="section-title">LOYALTY DESERVES INFRASTRUCTURE.</div>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '560px', lineHeight: 1.65 }}>
                        Platforms reward noise. Fans invest time, emotion, and identity, and get almost nothing back.
                        Mad Fan is building the foundational primitives that make loyalty visible, verifiable, and valuable,
                        starting with football, proving it in Season 01, then scaling globally.
                    </p>
                    <div className="story-cards story-cards--campaign">
                        <div className="story-card">
                            <div className="story-card__label">PASS</div>
                            <div className="story-card__title">Fan Passport</div>
                            <p className="story-card__body">Own a portable loyalty identity you can share and verify anywhere.</p>
                        </div>
                        <div className="story-card">
                            <div className="story-card__label">SCORE</div>
                            <div className="story-card__title">Real Dedication</div>
                            <p className="story-card__body">Daily streaks, tasks, and referrals separate superfans from noise.</p>
                        </div>
                        <div className="story-card">
                            <div className="story-card__label">BOARD</div>
                            <div className="story-card__title">Season 01 Rewards</div>
                            <p className="story-card__body">Climb THE BOARD for early access, token allocation, and founding status.</p>
                        </div>
                    </div>
                    <div className="campaign-story-links">
                        <Link href="/about" className="btn-action btn-go">
                            About Mad Fan
                        </Link>
                        <Link href="/roadmap" className="btn-action btn-go">
                            See the roadmap
                        </Link>
                    </div>
                </div>
            </section>

            <section>
                <div className="wrap">
                    <div className="section-eye">Campaign Structure</div>
                    <div className="section-title">8 WEEKS. 8 CHAPTERS.</div>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '540px' }}>
                        Season 01 is live on madfan.xyz. Each week unlocks new tasks, bigger bonuses, and exclusive
                        milestones: the proving ground for the Loyalty Layer.
                    </p>
                    <div className="seasons-grid">
                        {WEEKS.map((week) => (
                            <div key={week.num} className={`season-card${week.active ? ' active' : ''}`}>
                                <div className="season-num">{week.num}</div>
                                <div className="season-name">{week.name}</div>
                                <div className="season-desc">{week.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section>
                <div className="wrap">
                    <div className="section-eye">Daily Engagement</div>
                    <div className="section-title">CLAIM EVERY DAY.</div>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '540px' }}>
                        Log in daily to claim your points. Streaks multiply your earnings. Miss a day and your streak
                        resets, but your total stays.
                    </p>
                    <div className="daily-strip">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '1px' }}>
                                    THIS WEEK&apos;S STREAK
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: '11px',
                                        color: 'var(--muted)',
                                        marginTop: '2px',
                                    }}
                                >
                                    CURRENT MULTIPLIER:{' '}
                                    <span style={{ color: 'var(--flame)' }}>{multiplier}×</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', color: 'var(--flame)' }}>
                                    {streakDays} DAYS
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: '10px',
                                        color: 'var(--muted)',
                                    }}
                                >
                                    STREAK ACTIVE
                                </div>
                            </div>
                        </div>
                        <div className="days-row">
                            {activeDays.map((day, index) => (
                                <div
                                    key={`${day.label}-${index}`}
                                    className={`day-box${day.claimed ? ' claimed' : ''}${day.today ? ' today' : ''}`}
                                    onClick={() => claimToday(index)}
                                    onKeyDown={(e) => e.key === 'Enter' && claimToday(index)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="day-num">{day.label}</div>
                                    <div className="day-pts">+{day.pts}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                            Complete 7 days → unlock{' '}
                            <span style={{ color: 'var(--flame)', fontWeight: 600 }}>500 bonus points</span> + 2×
                            multiplier next week.
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="wrap">
                    <div className="section-eye">Point System</div>
                    <div className="section-title">HOW YOU EARN.</div>
                    <div className="earn-grid">
                        {EARN_CARDS.map((card) => (
                            <div key={card.name} className="earn-card">
                                <div className="earn-icon">
                                    <img src={card.icon} alt={card.iconAlt} width={28} height={28} />
                                </div>
                                <div>
                                    <div className="earn-pts">{card.pts}</div>
                                    <div className="earn-name">{card.name}</div>
                                    <div className="earn-desc">{card.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section>
                <div className="wrap">
                    <div className="section-eye">Referral Programme</div>
                    <div className="section-title">BUILD YOUR SQUAD.</div>
                    <div className="ref-block">
                        <div>
                            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                                Every fan you bring in earns you points and unlocks milestone rewards. The more you
                                refer, the bigger the prize.
                            </p>
                            <div className="ref-tiers">
                                {REF_TIERS.map((tier) => (
                                    <div key={tier.count} className="ref-tier">
                                        <div className="ref-count">{tier.count}</div>
                                        <div>
                                            <div className="ref-reward-name">{tier.name}</div>
                                            <div className="ref-reward-desc">{tier.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="ref-visual">
                            <div className="ref-big">500</div>
                            <div
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '13px',
                                    color: 'var(--flame)',
                                    letterSpacing: '1px',
                                }}
                            >
                                PTS PER REFERRAL
                            </div>
                            <div className="ref-caption" style={{ marginTop: '16px' }}>
                                No cap · No limit · No ceiling
                            </div>
                            <div style={{ marginTop: '28px' }}>
                                <div
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: '11px',
                                        color: 'var(--muted)',
                                        marginBottom: '8px',
                                    }}
                                >
                                    YOUR REFERRAL LINK
                                </div>
                                <div
                                    style={{
                                        background: 'var(--pitch)',
                                        border: '1px solid var(--border)',
                                        padding: '12px 16px',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: '12px',
                                        color: 'var(--flame)',
                                    }}
                                >
                                    {formatReferralLink(referralLink)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="wrap">
                    <div className="section-eye">Live Rankings</div>
                    <div className="section-title">THE BOARD.</div>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '540px' }}>
                        Updated every 24 hours. Top 500 at end of Week 8 get early access. Top 100 get token rewards.
                    </p>
                    <div className="leaderboard">
                        <div className="lb-header">
                            <div className="lb-col">#</div>
                            <div className="lb-col">FAN</div>
                            <div className="lb-col">POINTS</div>
                            <div className="lb-col">TIER</div>
                        </div>
                        {leaderboard.length === 0 ? (
                            <div className="lb-row">
                                <div className="lb-rank">N/A</div>
                                <div className="lb-name">Be the first on the board</div>
                                <div className="lb-pts">0</div>
                                <div>
                                    <span className="lb-tier core">CORE</span>
                                </div>
                            </div>
                        ) : (
                            leaderboard.map((entry, index) => (
                                <div key={entry.user?.id ?? index} className={`lb-row${index < 3 ? ' top' : ''}`}>
                                    <div className={`lb-rank${index < 3 ? ' gold' : ''}`}>{entry.rank ?? index + 1}</div>
                                    <div className="lb-name">
                                        {entry.user?.email_masked
                                            ?? entry.user?.username
                                            ?? entry.user?.fan_id
                                            ?? 'Fan'}
                                    </div>
                                    <div className="lb-pts">{Number(entry.points ?? 0).toLocaleString()}</div>
                                    <div>
                                        <span className={`lb-tier ${tierClass(entry.user?.loyalty_tier?.name)}`}>
                                            {(entry.user?.loyalty_tier?.name ?? 'CORE').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section>
                <div className="wrap">
                    <div className="section-eye">End of Season Rewards</div>
                    <div className="section-title">WHAT YOU&apos;RE PLAYING FOR.</div>
                    <div className="tiers-grid">
                        <div className="tier-card">
                            <div className="tier-name" style={{ color: 'var(--muted)' }}>
                                CORE FAN
                            </div>
                            <div className="tier-pts-req">500 to 4,999 POINTS</div>
                            <ul className="tier-perks">
                                <li>Waitlist confirmed</li>
                                <li>Early access (Wave 3)</li>
                                <li>Core Fan badge</li>
                                <li>Platform launch bonus</li>
                            </ul>
                        </div>
                        <div className="tier-card featured">
                            <div className="tier-name" style={{ color: 'var(--ember)' }}>
                                ULTRA FAN
                            </div>
                            <div className="tier-pts-req">5,000 to 14,999 POINTS</div>
                            <ul className="tier-perks">
                                <li>Priority early access (Wave 1)</li>
                                <li>Ultra Fan badge (permanent)</li>
                                <li>Token reward allocation</li>
                                <li>Founding member status</li>
                                <li>Loyalty score head start</li>
                            </ul>
                        </div>
                        <div className="tier-card">
                            <div className="tier-name" style={{ color: 'var(--flame)' }}>
                                LEGEND
                            </div>
                            <div className="tier-pts-req">15,000+ POINTS</div>
                            <ul className="tier-perks">
                                <li>Day-one access</li>
                                <li>Legend badge (lifetime)</li>
                                <li>Max token allocation</li>
                                <li>Founding member NFT</li>
                                <li>Ambassador consideration</li>
                                <li>IRL event invite</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {claimFlash && (
                <div
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '48px',
                        color: '#e8ff00',
                        pointerEvents: 'none',
                        animation: 'fadeUp 1.2s forwards',
                        zIndex: 999,
                    }}
                >
                    {claimFlash}
                </div>
            )}
        </FanLayout>
    );
}
