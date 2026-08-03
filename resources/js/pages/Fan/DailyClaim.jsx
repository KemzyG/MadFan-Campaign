import { Head, router, usePage } from '@inertiajs/react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import ClaimCelebration from '../../Components/Fan/ClaimCelebration';
import ShootoutSessionCard from '../../Components/Fan/ShootoutSessionCard';
import {
    appendAward,
    appendLoss,
    applySyncResults,
    hasPending,
    pendingTotals,
    readPending,
} from '../../Components/Fan/shootoutPendingStore';
import FanLayout from '../../Layouts/FanLayout';

const PenaltyShootOut = lazy(() => import('../../Components/Fan/PenaltyShootOut'));

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const CELEBRATION_MS = 2800;
const IDLE_FLUSH_MS = 4000;
const FLUSH_THRESHOLD = 8;

function pointsForShootoutZone(zone, cornerBonusEnabled) {
    const col = Number(zone?.col);
    const row = Number(zone?.row);

    if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || col > 2 || row < 0 || row > 2) {
        return 0;
    }

    if (!cornerBonusEnabled) {
        return 1;
    }

    const isCorner = (col === 0 || col === 2) && (row === 0 || row === 2);

    return isCorner ? 3 : 1;
}

function reconcileWithPending(server, pending) {
    if (!server) {
        return null;
    }

    // Optimistic: server confirmed + every locally buffered award/loss.
    const totals = pendingTotals(pending);
    const windowLimit = server.window_limit ?? 15;
    const cooling = (server.cooldown_seconds ?? 0) > 0;

    return {
        ...server,
        earned_today: (server.earned_today ?? 0) + totals.points,
        wins_today: (server.wins_today ?? 0) + totals.shots,
        losses_today: (server.losses_today ?? 0) + totals.losses,
        window_earned: cooling
            ? (server.window_earned ?? 0)
            : Math.min(windowLimit, (server.window_earned ?? 0) + totals.shots),
    };
}

export default function DailyClaim({
    is_available,
    streak,
    points_preview,
    milestones = [],
    history = [],
    shootout: shootoutProp = null,
}) {
    const page = usePage();
    const { flash } = page.props;
    const userId = page.props?.auth?.user?.id ?? null;
    const [flashPts, setFlashPts] = useState(null);
    const [shootout, setShootout] = useState(
        () =>
            shootoutProp ?? {
                active: true,
                window_earned: 0,
                window_limit: 15,
                cooldown_until: null,
                cooldown_seconds: 0,
                corner_bonus_enabled: false,
                earned_today: 0,
                wins_today: 0,
                losses_today: 0,
                min_seconds_between: 5,
            },
    );
    const shootoutRef = useRef(shootout);
    const serverShootoutRef = useRef(shootoutProp);
    const flushBusyRef = useRef(false);
    const idleFlushTimerRef = useRef(null);
    const claimed = !is_available;
    const streakDays = streak?.current_streak_days ?? 0;
    const pointsToday = points_preview?.points_today ?? 0;
    const coolingDown = (shootout.cooldown_seconds ?? 0) > 0;

    useEffect(() => {
        shootoutRef.current = shootout;
    }, [shootout]);

    function paintFromServerAndPending(server, pendingOverride = null) {
        const pending = pendingOverride ?? readPending(userId);
        const reconciled = reconcileWithPending(server, pending);

        if (!reconciled) {
            return;
        }

        setShootout((current) => {
            const next = { ...current, ...reconciled };
            shootoutRef.current = next;

            return next;
        });
    }

    useEffect(() => {
        if (shootoutProp) {
            serverShootoutRef.current = shootoutProp;
            paintFromServerAndPending(shootoutProp);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate from props + local pending
    }, [shootoutProp, userId]);

    useEffect(() => {
        if (!shootout.cooldown_until) {
            return undefined;
        }

        const tick = () => {
            const endsAt = new Date(shootout.cooldown_until).getTime();
            const secondsLeft = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));

            setShootout((current) => ({
                ...current,
                cooldown_seconds: secondsLeft,
                cooldown_until: secondsLeft === 0 ? null : current.cooldown_until,
                active: secondsLeft === 0,
                window_earned: secondsLeft === 0 ? 0 : current.window_earned,
            }));
        };

        tick();
        const id = window.setInterval(tick, 1000);

        return () => window.clearInterval(id);
    }, [shootout.cooldown_until]);

    useEffect(() => {
        if (!flash?.success) {
            return undefined;
        }

        setFlashPts(pointsToday);
        const t = setTimeout(() => setFlashPts(null), CELEBRATION_MS);

        return () => clearTimeout(t);
    }, [flash?.success, pointsToday]);

    const weekCells = useMemo(() => {
        const today = new Date();
        const dayIndex = (today.getDay() + 6) % 7;
        const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayIndex);

        const claimedDates = new Set(
            (history ?? [])
                .map((entry) => {
                    if (!entry?.claim_date) {
                        return null;
                    }

                    return String(entry.claim_date).slice(0, 10);
                })
                .filter(Boolean),
        );

        return DAYS.map((name, i) => {
            const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            const isToday = i === dayIndex;
            const isPast = i < dayIndex;
            const isFuture = i > dayIndex;
            const claimedDay = claimedDates.has(dateKey) || (isToday && claimed);
            const matchingClaim = (history ?? []).find(
                (entry) => String(entry?.claim_date ?? '').slice(0, 10) === dateKey,
            );

            return {
                name,
                num: i + 1,
                dateKey,
                isToday,
                isPast,
                isFuture,
                claimedDay,
                pts: matchingClaim?.points_earned ?? points_preview?.base_points ?? 50,
            };
        });
    }, [claimed, history, points_preview?.base_points]);

    const claimedThisWeek = weekCells.filter((cell) => cell.claimedDay).length;

    const maxMilestone = milestones.length ? milestones[milestones.length - 1].day_count : 30;
    const milestonePct = Math.min((streakDays / maxMilestone) * 100, 100);

    function doClaim() {
        if (claimed) {
            return;
        }

        setFlashPts(pointsToday);
        window.setTimeout(() => setFlashPts(null), CELEBRATION_MS);

        router.post(
            '/daily-claim',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: [
                    'flash',
                    'is_available',
                    'streak',
                    'history',
                    'milestones',
                    'points_preview',
                    'next_reset_at',
                ],
            },
        );
    }

    function scheduleIdleFlush() {
        if (idleFlushTimerRef.current) {
            window.clearTimeout(idleFlushTimerRef.current);
        }

        idleFlushTimerRef.current = window.setTimeout(() => {
            flushPending('idle');
        }, IDLE_FLUSH_MS);
    }

    async function flushPending(reason = 'manual') {
        if (!userId || flushBusyRef.current) {
            return;
        }

        const pending = readPending(userId);
        if (!hasPending(pending)) {
            return;
        }

        flushBusyRef.current = true;
        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        const payload = {
            awards: pending.awards.map((row) => ({
                idempotency_key: row.idempotency_key,
                occurred_at: row.occurred_at,
                zone: row.zone,
            })),
            losses: pending.losses.map((row) => ({
                idempotency_key: row.idempotency_key,
                occurred_at: row.occurred_at,
                result: row.result ?? 'miss',
            })),
        };

        try {
            const response = await window.fetch('/daily-claim/shootout/bulk', {
                method: 'POST',
                credentials: 'same-origin',
                keepalive: reason === 'pagehide' || reason === 'hidden',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                return;
            }

            const nextPending = applySyncResults(userId, data.results ?? [], data.loss_results ?? []);

            if (data.shootout) {
                serverShootoutRef.current = data.shootout;
                paintFromServerAndPending(data.shootout, nextPending);
            }
        } catch {
            // Keep localStorage pending; sync on next enter/idle/beacon.
        } finally {
            flushBusyRef.current = false;
        }
    }

    useEffect(() => {
        if (!userId) {
            return undefined;
        }

        flushPending('enter');

        const onVisibility = () => {
            if (document.visibilityState === 'hidden') {
                flushPending('hidden');
            }
        };
        const onPageHide = () => {
            flushPending('pagehide');
        };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', onPageHide);

        const safety = window.setInterval(() => {
            flushPending('interval');
        }, 30000);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', onPageHide);
            window.clearInterval(safety);
            if (idleFlushTimerRef.current) {
                window.clearTimeout(idleFlushTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount flush wiring for user
    }, [userId]);

    function creditShootoutWin({ zone, points }) {
        if (coolingDown || !userId || !zone || zone.col == null || zone.row == null) {
            return;
        }

        const expectedPoints =
            pointsForShootoutZone(zone, Boolean(shootoutRef.current.corner_bonus_enabled)) ||
            Math.max(0, Number(points) || 0);

        if (expectedPoints <= 0) {
            return;
        }

        const award = {
            idempotency_key: crypto.randomUUID(),
            zone: { col: zone.col, row: zone.row },
            occurred_at: new Date().toISOString(),
            expected_points: expectedPoints,
        };

        const pending = appendAward(userId, award);
        const server = serverShootoutRef.current ?? shootoutRef.current;
        paintFromServerAndPending(server, pending);

        if (pending.awards.length + pending.losses.length >= FLUSH_THRESHOLD) {
            flushPending('threshold');
        } else {
            scheduleIdleFlush();
        }
    }

    function recordShootoutLoss({ result } = {}) {
        if (coolingDown || !userId) {
            return;
        }

        const loss = {
            idempotency_key: crypto.randomUUID(),
            result: result ?? 'miss',
            occurred_at: new Date().toISOString(),
        };

        const pending = appendLoss(userId, loss);
        const server = serverShootoutRef.current ?? shootoutRef.current;
        paintFromServerAndPending(server, pending);

        if (pending.awards.length + pending.losses.length >= FLUSH_THRESHOLD) {
            flushPending('threshold');
        } else {
            scheduleIdleFlush();
        }
    }

    return (
        <FanLayout>
            <Head title="Daily Claim" />

            <div className="wrap">
                <div className="page-header" />

                <ShootoutSessionCard shootout={shootout} />

                <div className={`claim-zone${coolingDown ? ' is-cooling' : ''}`}>
                    {!coolingDown ? (
                        <p className="pso-mobile-play-hint">Tap FULL for edge-to-edge mobile play</p>
                    ) : null}
                    <Suspense
                        fallback={
                            <div className="penalty-shot penalty-shot-3d penalty-shot-loading">
                                Loading stadium...
                            </div>
                        }
                    >
                        <PenaltyShootOut
                            disabled={coolingDown}
                            scored={claimed}
                            freePlay={!coolingDown}
                            cooldownSeconds={shootout.cooldown_seconds ?? 0}
                            cornerBonusEnabled={Boolean(shootout.corner_bonus_enabled)}
                            initialWins={shootout.wins_today ?? 0}
                            initialLosses={shootout.losses_today ?? 0}
                            pointsLabel={claimed ? '' : `+${pointsToday} PTS`}
                            onScore={doClaim}
                            onWinPoints={creditShootoutWin}
                            onLoss={recordShootoutLoss}
                        />
                    </Suspense>
                </div>

                <div className="week-section">
                    <div className="section-head">
                        <div className="section-title">THIS WEEK</div>
                        <div className="section-sub">
                            {claimedThisWeek} / 7 CLAIMED · STREAK {streakDays}
                        </div>
                    </div>
                    <div className="week-grid">
                        {weekCells.map((cell) => (
                            <div
                                key={cell.name}
                                className={[
                                    'day-cell',
                                    cell.claimedDay ? 'claimed-day' : '',
                                    cell.isToday ? 'today-cell' : '',
                                    cell.isFuture ? 'future' : '',
                                    cell.isPast && !cell.claimedDay ? 'past' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >
                                <div className="day-name">{cell.name}</div>
                                <div className="day-num-big">{cell.num}</div>
                                <div className="day-pts-tag">+{cell.pts}</div>
                                {cell.isToday && <div className="today-marker" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="milestones">
                    <div className="section-head">
                        <div className="section-title">STREAK MILESTONES</div>
                        <div className="section-sub">
                            CURRENT:{' '}
                            <span style={{ color: 'var(--flame)' }}>{streakDays} DAYS</span>
                        </div>
                    </div>
                    <div className="milestone-track">
                        <div className="milestone-line" />
                        <div className="milestone-fill" style={{ width: `${milestonePct}%` }} />
                        <div className="milestones-row">
                            {milestones.map((m, idx) => {
                                const reached = streakDays >= m.day_count;
                                const next = milestones[idx + 1];
                                const current = reached && (!next || streakDays < next.day_count);
                                return (
                                    <div
                                        key={m.day_count}
                                        className={`milestone${reached ? ' reached' : ''}${current ? ' current' : ''}`}
                                    >
                                        <div className="milestone-dot" />
                                        <div className="milestone-day">D{m.day_count}</div>
                                        <div className="milestone-reward">
                                            +{m.bonus_points}
                                            <br />
                                            {m.name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="section-head" style={{ marginBottom: '14px' }}>
                        <div className="section-title">POINT MULTIPLIERS</div>
                        <div className="section-sub">BASE: {points_preview?.base_points ?? 10} PTS/DAY</div>
                    </div>
                    <div className="mult-grid">
                        <div className={`mult-cell${streakDays <= 2 ? ' active' : ''}`}>
                            <div className="mult-streak">DAY 1-2</div>
                            <div className="mult-val">1x</div>
                            <div className="mult-pts">{points_preview?.base_points ?? 10} PTS / day</div>
                            {streakDays <= 2 && <div className="active-tag">ACTIVE</div>}
                        </div>
                        <div className={`mult-cell${streakDays >= 3 && streakDays < 7 ? ' active' : ''}`}>
                            <div className="mult-streak">DAY 3-6</div>
                            <div className="mult-val">1.5x</div>
                            <div className="mult-pts">Boosted / day</div>
                            {streakDays >= 3 && streakDays < 7 && <div className="active-tag">ACTIVE</div>}
                        </div>
                        <div className={`mult-cell${streakDays >= 7 && streakDays < 14 ? ' active' : ''}`}>
                            <div className="mult-streak">DAY 7-13</div>
                            <div className="mult-val">2x</div>
                            <div className="mult-pts">Boosted / day</div>
                            {streakDays >= 7 && streakDays < 14 && <div className="active-tag">ACTIVE</div>}
                        </div>
                        <div className={`mult-cell${streakDays >= 14 ? ' active' : ''}`}>
                            <div className="mult-streak">DAY 14+</div>
                            <div className="mult-val">3x</div>
                            <div className="mult-pts">Boosted / day</div>
                            {streakDays >= 14 && <div className="active-tag">ACTIVE</div>}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '40px', marginBottom: '60px' }}>
                    <div className="section-head" style={{ marginBottom: '14px' }}>
                        <div className="section-title">SEASON HISTORY</div>
                        <div className="section-sub">RECENT CLAIMS</div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--muted)' }}>
                        {history.length === 0
                            ? 'No claims yet this season.'
                            : history.slice(0, 7).map((h) => (
                                  <div key={h.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                      {h.claim_date} · +{h.points_earned} pts · streak day {h.streak_day_number}
                                  </div>
                              ))}
                    </div>
                </div>
            </div>

            {flashPts != null && <ClaimCelebration points={flashPts} />}
        </FanLayout>
    );
}
