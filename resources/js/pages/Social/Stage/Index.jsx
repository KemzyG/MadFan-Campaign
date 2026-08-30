import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { StageLobbySkeleton } from '../components/Skeletons';
import CreateStageSheet from './CreateStageSheet';
import StageLobbyToolbar from './StageLobbyToolbar';
import { IconLive, IconMic } from './StageIcons';
import { useStageSessionOptional } from './StageSessionContext';

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'club', label: 'My club' },
    { key: 'voice', label: 'Voice live' },
    { key: 'busy', label: 'Busiest' },
];

const SORTS = [
    { key: 'newest', label: 'Newest' },
    { key: 'listeners', label: 'Most listeners' },
];

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
    const speakers = stage.speaker_count ?? 0;
    const isActiveSession = session?.activeStageId === stage.id;
    const voiceOn = Boolean(stage.voice_enabled);

    function join(e) {
        if (String(stage.id).startsWith('tmp-')) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        session?.unlockVoicePlayback?.();
        router.visit(`/social/stage/${stage.id}`);
    }

    return (
        <Link
            href={`/social/stage/${stage.id}`}
            className={`mf-stage-card ${stage._optimistic ? 'is-optimistic' : ''} ${isActiveSession ? 'is-active-session' : ''}`.trim()}
            style={{ '--mf-stage-stagger': `${Math.min(index, 8) * 55}ms` }}
            prefetch={!stage._optimistic && !isActiveSession}
            onClick={join}
        >
            <div className="mf-stage-card__topline">
                <span className="mf-stage-live-chip mf-mono">
                    <IconLive className="mf-stage-live-chip__icon" />
                    Live
                </span>
                {voiceOn ? (
                    <span className="mf-stage-card__voice mf-mono mf-text-micro">
                        <IconMic className="mf-stage-card__voice-glyph" />
                        Voice
                    </span>
                ) : null}
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
                    {stage.club?.name ? (
                        <p className="mf-stage-card__club mf-text-micro text-[var(--mf-muted)] truncate">
                            {stage.club.name}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="mf-stage-card__foot">
                <span className="mf-stage-card__stat mf-mono mf-text-micro">
                    {speakers} on mic
                </span>
                <span className="mf-stage-card__stat mf-mono mf-text-micro">
                    {listeners} listening
                </span>
                <span className="mf-stage-card__join mf-btn mf-btn--pitch" aria-hidden>
                    {isActiveSession ? 'Reopen' : 'Join'}
                </span>
            </div>
        </Link>
    );
}

export default function Index({
    stages,
    max_title_length = 80,
    max_description_length = 280,
    stage_backgrounds = [],
}) {
    const { auth } = usePage().props;
    const myClubId = auth?.user?.club?.id ?? auth?.user?.club_id ?? null;
    const stageList = stages ?? [];
    const [createOpen, setCreateOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('newest');

    const voiceLiveCount = useMemo(
        () => stageList.filter((s) => s.voice_enabled).length,
        [stageList],
    );

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = stageList.filter((stage) => {
            if (filter === 'voice' && !stage.voice_enabled) {
                return false;
            }
            if (filter === 'busy' && (stage.listener_count ?? 0) <= 0) {
                return false;
            }
            if (filter === 'club' && !(myClubId && stage.club?.id === myClubId)) {
                return false;
            }
            if (!q) {
                return true;
            }
            const haystack = [stage.title, stage.description, stage.host?.name, stage.club?.name]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });

        list = [...list].sort((a, b) => {
            if (sort === 'listeners') {
                return (b.listener_count ?? 0) - (a.listener_count ?? 0);
            }
            const at = new Date(a.started_at || 0).getTime();
            const bt = new Date(b.started_at || 0).getTime();
            return bt - at;
        });

        return list;
    }, [stageList, query, filter, sort, myClubId]);

    const hasStages = stageList.length > 0;
    const filtersActive = query.trim() !== '' || filter !== 'all';

    function clearFilters() {
        setQuery('');
        setFilter('all');
    }

    // Camera broadcasting is a separate, distinctly-designed flow now — its
    // own page (Social/Live/Create.jsx), not a second sheet duplicating
    // /social/live's own "Go Live" form. Submitting it creates a LiveStage
    // and redirects into /social/live/{id}'s Creator Studio, not a Stage room.
    function goLive() {
        router.visit('/social/live/new');
    }

    return (
        <SocialShell title="Stage" showTabs wide>
            <Head title="Stage · Mad Fan Social" />

            {stages == null ? (
                <StageLobbySkeleton />
            ) : (
                <div className="mf-stage-lobby">
                    <header className="mf-stage-hero">
                        <div className="mf-stage-hero__copy min-w-0">
                            <span className="mf-stage-hero__eyebrow mf-mono">
                                <span className="mf-stage-live-dot" />
                                {stageList.length} live · {voiceLiveCount} on voice
                            </span>
                            <h1 className="mf-stage-hero__title">Live on stage</h1>
                            <p className="mf-stage-hero__sub mf-text-meta text-[var(--mf-muted)]">
                                Drop into a live room, or start your own — voice-only, or on camera.
                            </p>
                        </div>
                        <div className="mf-stage-hero__cta-group">
                            <button
                                type="button"
                                className="mf-btn mf-stage-hero__cta"
                                onClick={() => setCreateOpen(true)}
                            >
                                <IconMic className="mf-stage-hero__cta-glyph" />
                                Start voice room
                            </button>
                            <button
                                type="button"
                                className="mf-btn mf-btn--pitch mf-stage-hero__cta"
                                onClick={goLive}
                            >
                                <IconLive className="mf-stage-hero__cta-glyph" />
                                Go live
                            </button>
                        </div>
                    </header>

                    {hasStages ? (
                        <StageLobbyToolbar
                            query={query}
                            onQuery={setQuery}
                            filter={filter}
                            onFilter={setFilter}
                            filters={FILTERS}
                            sort={sort}
                            onSort={setSort}
                            sorts={SORTS}
                        />
                    ) : null}

                    <section className="mf-stage-board" aria-label="Live stages">
                        {!hasStages ? (
                            <div className="mf-stage-empty mf-empty mf-empty--compact">
                                <div className="mf-stage-empty__mark" aria-hidden>
                                    <span className="mf-stage-live-dot mf-stage-live-dot--lg" />
                                </div>
                                <p className="mf-empty-title">Terrace is quiet</p>
                                <p>No live Stages yet. Start a voice room or go live and be first.</p>
                                <div className="mf-stage-empty__ctas mt-4">
                                    <button type="button" className="mf-btn" onClick={() => setCreateOpen(true)}>
                                        Start voice room
                                    </button>
                                    <button
                                        type="button"
                                        className="mf-btn mf-btn--pitch"
                                        onClick={goLive}
                                    >
                                        Go live
                                    </button>
                                </div>
                            </div>
                        ) : visible.length === 0 ? (
                            <div className="mf-stage-empty mf-empty mf-empty--compact">
                                <p className="mf-empty-title">No stages match</p>
                                <p>Try a different search or filter.</p>
                                <button type="button" className="mf-btn mt-4" onClick={clearFilters}>
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div className="mf-stage-grid">
                                {visible.map((stage, index) => (
                                    <StageCard key={stage.id} stage={stage} index={index} />
                                ))}
                            </div>
                        )}
                    </section>

                    <CreateStageSheet
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
