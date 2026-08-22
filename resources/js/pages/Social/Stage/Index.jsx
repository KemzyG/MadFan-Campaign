import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { StageLobbySkeleton } from '../components/Skeletons';
import { useStageSessionOptional } from './StageSessionContext';
import CreateStageModal from './CreateStageModal';
import { IconLive } from './StageIcons';

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

function StageCard({ stage, index = 0 }) {
    const session = useStageSessionOptional();
    const listeners = stage.listener_count ?? 0;
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

        session?.unlockVoicePlayback?.();
        e.preventDefault();
        router.visit(`/social/stage/${stage.id}`);
    }

    return (
        <Link
            href={`/social/stage/${stage.id}`}
            className={`mf-stage-card mf-stage-card--compact ${stage._optimistic ? 'is-optimistic' : ''} ${isActiveSession ? 'is-active-session' : ''}`}
            style={{ '--mf-stage-stagger': `${Math.min(index, 8) * 55}ms` }}
            prefetch={!stage._optimistic && !isActiveSession}
            onClick={join}
        >
            <div className="mf-stage-card__rail" aria-hidden>
                <span className="mf-stage-live-dot" />
            </div>

            <div className="mf-stage-card__body">
                <div className="mf-stage-card__topline">
                    <span className="mf-stage-live-chip mf-mono">
                        <IconLive className="mf-stage-live-chip__icon" />
                        Live
                    </span>
                    {isActiveSession ? (
                        <span className="mf-mono mf-text-micro text-[var(--mf-pitch)]">Listening</span>
                    ) : null}
                    {stage._optimistic ? (
                        <span className="mf-mono mf-text-micro text-[var(--mf-amber)]">Opening…</span>
                    ) : null}
                </div>

                <p className="mf-stage-card__title">{stage.title}</p>

                {stage.description ? (
                    <p className="mf-stage-card__description mf-text-meta text-[var(--mf-muted)] line-clamp-2">
                        {stage.description}
                    </p>
                ) : null}

                <div className="mf-stage-card__host">
                    <Avatar user={stage.host} size="sm" />
                    <div className="mf-stage-card__host-meta min-w-0">
                        <p className="mf-stage-card__host-name truncate">
                            {stage.host?.name || 'Host'}
                            {stage.host?.handle ? (
                                <span className="mf-mono text-[var(--mf-muted)]"> @{stage.host.handle}</span>
                            ) : null}
                        </p>
                    </div>
                </div>

                <p className="mf-stage-card__listeners mf-mono mf-text-micro text-[var(--mf-muted)]">
                    {listeners} listening
                </p>
            </div>

            <span className="mf-stage-card__join mf-btn mf-btn--pitch mf-stage-card__join-btn" aria-hidden>
                {isActiveSession ? 'Reopen' : 'Join'}
            </span>
        </Link>
    );
}

export default function Index({
    stages,
    max_title_length = 80,
    max_description_length = 280,
    max_speakers = 8,
    stage_backgrounds = [],
    voice_note,
}) {
    const stageList = stages ?? [];
    const [createOpen, setCreateOpen] = useState(false);

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
                        <div className="mf-stage-hero__meta">
                            <span className="mf-stage-hero__count mf-mono">
                                {stageList.length} live
                            </span>
                            {voice_note ? (
                                <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{voice_note}</span>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            className="mf-btn mf-btn--pitch mf-stage-hero__cta"
                            onClick={() => setCreateOpen(true)}
                        >
                            Go live
                        </button>
                    </header>

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
                                <p>No live Stages yet. Go live and be first on the mic.</p>
                                <button
                                    type="button"
                                    className="mf-btn mf-btn--pitch mt-4"
                                    onClick={() => setCreateOpen(true)}
                                >
                                    Go live
                                </button>
                            </div>
                        ) : (
                            <div className="mf-stage-list">
                                {stageList.map((stage, index) => (
                                    <StageCard key={stage.id} stage={stage} index={index} />
                                ))}
                            </div>
                        )}
                    </section>

                    <CreateStageModal
                        open={createOpen}
                        onClose={() => setCreateOpen(false)}
                        maxTitleLength={max_title_length}
                        maxDescriptionLength={max_description_length}
                        stageBackgrounds={stage_backgrounds}
                    />
                </div>
            )}
        </SocialShell>
    );
}
