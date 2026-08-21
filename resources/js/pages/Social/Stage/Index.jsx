import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { StageLobbySkeleton } from '../components/Skeletons';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { useStageSessionOptional } from './StageSessionContext';

function Avatar({ user, size = 'md' }) {
    const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (user?.avatar_url) {
        return (
            <img
                src={user.avatar_url}
                alt=""
                className={`mf-avatar ${sizeClass}`}
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }
    const label = (user?.handle || user?.name || '?').slice(0, 2).toUpperCase();
    return (
        <span className={`mf-avatar mf-text-meta ${sizeClass}`} aria-hidden>
            {user?.avatar_emoji || label}
        </span>
    );
}

function CreateStageForm({ maxTitleLength }) {
    const page = usePage();
    const authUser = page.props?.auth?.user;
    const { reportError } = useSocialFlash();
    const { data, setData, post, processing, errors, reset, optimistic } = useForm({
        title: '',
    });

    function submit(e) {
        e.preventDefault();
        if (!data.title.trim()) {
            return;
        }

        const tempId = `tmp-${Date.now()}`;
        const title = data.title.trim();

        optimistic((props) => ({
            stages: [
                {
                    id: tempId,
                    title,
                    status: 'live',
                    voice_enabled: false,
                    started_at: new Date().toISOString(),
                    host: {
                        id: authUser?.id,
                        name: authUser?.name || 'You',
                        handle: authUser?.handle,
                        avatar_url: authUser?.avatar_url,
                        avatar_emoji: authUser?.avatar_emoji,
                    },
                    club: null,
                    speaker_count: 1,
                    listener_count: 0,
                    participant_count: 1,
                    _optimistic: true,
                },
                ...(props.stages || []),
            ],
        })).post(
            '/social/stage',
            withRollbackFlash(reportError, {
                onSuccess: () => reset('title'),
            }),
        );
    }

    const remaining = maxTitleLength - data.title.length;
    const canGoLive = data.title.trim().length >= 3 && !processing;

    return (
        <form className="mf-stage-create" onSubmit={submit}>
            <div className="mf-stage-create__head">
                <p className="mf-text-caption text-[var(--mf-pitch)]">Host the terrace</p>
                <p className="mf-stage-create__title mf-display">Go live</p>
                <p className="mf-stage-create__hint mf-text-meta text-[var(--mf-muted)]">
                    Open a voice room — fans drop in as listeners, you invite speakers up.
                </p>
            </div>
            <label className="sr-only" htmlFor="stage-title">
                Stage title
            </label>
            <div className="mf-stage-create__row">
                <input
                    id="stage-title"
                    className="mf-stage-create__input"
                    maxLength={maxTitleLength}
                    placeholder="Match reaction, transfer window, derby debate…"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    disabled={processing}
                    autoComplete="off"
                />
                <button type="submit" className="mf-btn mf-btn--pitch mf-stage-create__cta" disabled={!canGoLive}>
                    {processing ? 'Opening…' : 'Go live'}
                </button>
            </div>
            <div className="mf-stage-create__foot">
                {errors.title ? (
                    <p className="mf-field-error">{errors.title}</p>
                ) : (
                    <p className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                        {remaining} chars · min 3
                    </p>
                )}
            </div>
        </form>
    );
}

function StageCard({ stage, index = 0 }) {
    const session = useStageSessionOptional();
    const speakers = stage.speaker_count ?? 0;
    const listeners = stage.listener_count ?? 0;
    const inRoom = stage.participant_count ?? speakers + listeners;
    const isActiveSession = session?.activeStageId === stage.id;

    function join(e) {
        if (String(stage.id).startsWith('tmp-')) {
            e.preventDefault();
            return;
        }

        if (isActiveSession) {
            e.preventDefault();
            session.openModal();
            return;
        }

        // Deep-link join: Show seeds session + opens modal overlay.
        e.preventDefault();
        router.visit(`/social/stage/${stage.id}`);
    }

    return (
        <Link
            href={`/social/stage/${stage.id}`}
            className={`mf-stage-card ${stage._optimistic ? 'is-optimistic' : ''} ${isActiveSession ? 'is-active-session' : ''}`}
            style={{ '--mf-stage-stagger': `${Math.min(index, 8) * 55}ms` }}
            prefetch={!stage._optimistic && !isActiveSession}
            onClick={join}
        >
            <div className="mf-stage-card__rail" aria-hidden>
                <span className="mf-stage-live-dot" />
            </div>

            <div className="mf-stage-card__body">
                <div className="mf-stage-card__topline">
                    <span className="mf-stage-live-chip mf-mono">Live</span>
                    {stage.voice_enabled ? (
                        <span className="mf-stage-voice-chip mf-mono">Voice on</span>
                    ) : (
                        <span className="mf-stage-voice-chip mf-stage-voice-chip--off mf-mono">Text lobby</span>
                    )}
                    {isActiveSession ? (
                        <span className="mf-mono mf-text-micro text-[var(--mf-pitch)]">Listening</span>
                    ) : null}
                    {stage._optimistic ? (
                        <span className="mf-mono mf-text-micro text-[var(--mf-amber)]">Opening…</span>
                    ) : null}
                </div>

                <p className="mf-stage-card__title">{stage.title}</p>

                <div className="mf-stage-card__host">
                    <Avatar user={stage.host} size="sm" />
                    <div className="mf-stage-card__host-meta min-w-0">
                        <p className="mf-stage-card__host-name truncate">
                            {stage.host?.name || 'Host'}
                            {stage.host?.handle ? (
                                <span className="mf-mono text-[var(--mf-muted)]"> @{stage.host.handle}</span>
                            ) : null}
                        </p>
                        {stage.club?.name ? (
                            <p className="mf-text-meta text-[var(--mf-muted)] truncate">{stage.club.name}</p>
                        ) : null}
                    </div>
                </div>

                <div className="mf-stage-card__stats">
                    <span className="mf-stage-stat">
                        <span className="mf-stage-stat__value mf-mono">{speakers}</span>
                        <span className="mf-stage-stat__label">on stage</span>
                    </span>
                    <span className="mf-stage-stat">
                        <span className="mf-stage-stat__value mf-mono">{listeners}</span>
                        <span className="mf-stage-stat__label">listening</span>
                    </span>
                    <span className="mf-stage-stat">
                        <span className="mf-stage-stat__value mf-mono">{inRoom}</span>
                        <span className="mf-stage-stat__label">in room</span>
                    </span>
                </div>
            </div>

            <span className="mf-stage-card__join mf-text-ui">
                {isActiveSession ? 'Reopen' : 'Join room'}
                <span className="mf-stage-card__chev" aria-hidden>
                    →
                </span>
            </span>
        </Link>
    );
}

export default function Index({ stages, max_title_length = 80, max_speakers = 8, voice_note }) {
    const stageList = stages ?? [];

    return (
        <SocialShell title="Join stage" showTabs>
            <Head title="Join stage · Mad Fan Social" />

            {stages == null ? (
                <StageLobbySkeleton />
            ) : (
                <div className="mf-stage-lobby">
                    <header className="mf-stage-hero">
                        <p className="mf-stage-hero__kicker mf-text-caption">Live terrace</p>
                        <p className="mf-empty-title mf-stage-hero__title">Join stage</p>
                        <p className="mf-stage-hero__lead">
                            Drop into a live fan conversation — text in-room, voice on stage (≤{max_speakers}{' '}
                            speakers). Floodlit rooms, X-dense copy.
                        </p>
                        <div className="mf-stage-hero__meta">
                            <span className="mf-stage-hero__count mf-mono">
                                {stageList.length} live
                            </span>
                            {voice_note ? (
                                <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{voice_note}</span>
                            ) : null}
                        </div>
                    </header>

                    <CreateStageForm maxTitleLength={max_title_length} />

                    <section className="mf-stage-board" aria-label="Live stages">
                        <div className="mf-stage-board__head">
                            <p className="mf-text-caption text-[var(--mf-muted)]">Live now</p>
                            <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{stageList.length}</span>
                        </div>

                        {stageList.length === 0 ? (
                            <div className="mf-stage-empty mf-empty mf-empty--compact">
                                <div className="mf-stage-empty__mark" aria-hidden>
                                    <span className="mf-stage-live-dot mf-stage-live-dot--lg" />
                                </div>
                                <p className="mf-empty-title">Terrace is quiet</p>
                                <p>No live Stages yet. Open one above and be first on the mic.</p>
                            </div>
                        ) : (
                            <div className="mf-stage-list">
                                {stageList.map((stage, index) => (
                                    <StageCard key={stage.id} stage={stage} index={index} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </SocialShell>
    );
}
