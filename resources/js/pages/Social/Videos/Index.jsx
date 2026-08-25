import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { useSocialFlash, withRollbackFlash } from '../optimistic';

function formatCount(value) {
    const n = Number(value) || 0;
    if (n >= 1_000_000) {
        return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (n >= 10_000) {
        return `${Math.round(n / 1000)}K`;
    }
    if (n >= 1000) {
        return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }

    return String(n);
}

function IconPlay() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8.2 5.4c-.7-.4-1.6.1-1.6.9v11.4c0 .8.9 1.3 1.6.9l9.6-5.7c.7-.4.7-1.4 0-1.8L8.2 5.4Z" />
        </svg>
    );
}

function IconPause() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <rect x="6.5" y="5.5" width="3.5" height="13" rx="1" />
            <rect x="14" y="5.5" width="3.5" height="13" rx="1" />
        </svg>
    );
}

function CreateReelSheet({ open, onClose, limits }) {
    const titleId = useId();
    const { reportError } = useSocialFlash();
    const maxCaption = limits?.max_caption_length ?? 500;
    const maxDuration = limits?.max_duration_seconds ?? 90;
    const maxKb = limits?.max_upload_kb ?? 51200;
    const { data, setData, post, processing, errors, reset, progress } = useForm({
        video: null,
        title: '',
        caption: '',
        duration_seconds: null,
    });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    useEffect(() => {
        if (!data.video) {
            setPreviewUrl(null);
            return undefined;
        }

        const url = URL.createObjectURL(data.video);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [data.video]);

    if (!open) {
        return null;
    }

    function onPickVideo(event) {
        const file = event.target.files?.[0] || null;
        if (!file) {
            return;
        }

        setData('video', file);
        setData('duration_seconds', null);

        const probe = document.createElement('video');
        probe.preload = 'metadata';
        probe.onloadedmetadata = () => {
            const seconds = Math.round(probe.duration || 0);
            URL.revokeObjectURL(probe.src);
            setData('duration_seconds', seconds > 0 ? seconds : null);
        };
        probe.src = URL.createObjectURL(file);
    }

    function submit(event) {
        event.preventDefault();
        if (!data.video || processing) {
            return;
        }

        if (data.duration_seconds && data.duration_seconds > maxDuration) {
            reportError(`Keep reels under ${maxDuration} seconds.`);
            return;
        }

        post('/social/videos', withRollbackFlash(reportError, {
            forceFormData: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        }));
    }

    const canPublish = Boolean(data.video) && !processing;

    return (
        <div className="mf-sheet mf-sheet--stage-create" role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close" onClick={onClose} />
            <div
                className="mf-sheet__panel mf-sheet__panel--stage-create"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="mf-sheet__handle" aria-hidden />
                <div className="mf-sheet__head mf-sheet__head--stage-create">
                    <div className="mf-stage-create-modal__brand">
                        <div className="min-w-0">
                            <p id={titleId} className="mf-display mf-text-title tracking-[0.03em]">
                                New reel
                            </p>
                            <p className="mf-text-meta text-[var(--mf-muted)]">
                                Short mp4/webm · up to {Math.round(maxKb / 1024)}MB · {maxDuration}s
                            </p>
                        </div>
                    </div>
                    <button type="button" className="mf-sheet__close" onClick={onClose}>
                        Cancel
                    </button>
                </div>

                <form className="mf-stage-create-modal" onSubmit={submit}>
                    <div className="mf-stage-create-modal__scroll">
                        <section className="mf-stage-create-section">
                            <label className="mf-reel-create__picker">
                                <input
                                    type="file"
                                    accept="video/mp4,video/webm"
                                    className="hidden"
                                    onChange={onPickVideo}
                                    disabled={processing}
                                />
                                {previewUrl ? (
                                    <video
                                        className="mf-reel-create__preview"
                                        src={previewUrl}
                                        muted
                                        playsInline
                                        loop
                                        autoPlay
                                    />
                                ) : (
                                    <span className="mf-reel-create__placeholder">
                                        Tap to choose a clip
                                    </span>
                                )}
                            </label>
                            {errors.video ? <p className="mf-field-error">{errors.video}</p> : null}
                            {data.duration_seconds ? (
                                <p className="mf-text-meta text-[var(--mf-muted)] mt-2">
                                    Duration · {data.duration_seconds}s
                                    {data.duration_seconds > maxDuration ? ' (too long)' : ''}
                                </p>
                            ) : null}
                        </section>

                        <section className="mf-stage-create-section">
                            <div className="mf-stage-create-field">
                                <label className="mf-stage-create-field__label" htmlFor="reel-title">
                                    Title
                                    <span className="mf-stage-create-field__optional">Optional</span>
                                </label>
                                <input
                                    id="reel-title"
                                    className="mf-stage-create__input"
                                    maxLength={120}
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Derby day clip"
                                    disabled={processing}
                                />
                                {errors.title ? <p className="mf-field-error">{errors.title}</p> : null}
                            </div>
                            <div className="mf-stage-create-field">
                                <label className="mf-stage-create-field__label" htmlFor="reel-caption">
                                    Caption
                                    <span className="mf-stage-create-field__optional">Optional</span>
                                </label>
                                <textarea
                                    id="reel-caption"
                                    className="mf-stage-create__textarea"
                                    maxLength={maxCaption}
                                    rows={3}
                                    value={data.caption}
                                    onChange={(e) => setData('caption', e.target.value)}
                                    placeholder="Terrace angle, set-piece, last-minute chaos…"
                                    disabled={processing}
                                />
                                {errors.caption ? <p className="mf-field-error">{errors.caption}</p> : null}
                            </div>
                        </section>
                    </div>

                    <div className="mf-stage-create-modal__footer">
                        {progress ? (
                            <p className="mf-text-meta text-[var(--mf-muted)]">
                                Uploading… {progress.percentage}%
                            </p>
                        ) : null}
                        <button type="submit" className="mf-btn mf-btn--pitch w-full" disabled={!canPublish}>
                            {processing ? 'Publishing…' : 'Publish reel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ReelSlide({ reel, active, near, onView }) {
    const videoRef = useRef(null);
    const [muted, setMuted] = useState(true);
    const [liked, setLiked] = useState(Boolean(reel.liked));
    const [likesCount, setLikesCount] = useState(reel.likes_count ?? 0);
    const [playing, setPlaying] = useState(false);
    const [showControl, setShowControl] = useState(false);
    const [buffering, setBuffering] = useState(true);
    const controlTimerRef = useRef(null);
    const viewedRef = useRef(false);

    useEffect(() => {
        setLiked(Boolean(reel.liked));
        setLikesCount(reel.likes_count ?? 0);
        viewedRef.current = false;
    }, [reel.id, reel.liked, reel.likes_count]);

    const flashControl = useCallback(() => {
        setShowControl(true);
        if (controlTimerRef.current) {
            window.clearTimeout(controlTimerRef.current);
        }
        controlTimerRef.current = window.setTimeout(() => setShowControl(false), 900);
    }, []);

    useEffect(() => () => {
        if (controlTimerRef.current) {
            window.clearTimeout(controlTimerRef.current);
        }
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) {
            return undefined;
        }

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!active || reducedMotion) {
            video.pause();
            setPlaying(false);

            return undefined;
        }

        video.muted = muted;
        const playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => setPlaying(true))
                .catch(() => setPlaying(false));
        }

        if (!viewedRef.current) {
            viewedRef.current = true;
            onView(reel.id);
        }

        return undefined;
    }, [active, muted, onView, reel.id]);

    function togglePlayback(event) {
        event?.stopPropagation?.();
        const video = videoRef.current;
        if (!video || !active) {
            return;
        }

        if (video.paused) {
            video.muted = muted;
            video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
            video.pause();
            setPlaying(false);
        }
        flashControl();
    }

    function toggleMute(event) {
        event.stopPropagation();
        setMuted((prev) => !prev);
    }

    function toggleLike(event) {
        event.stopPropagation();
        const nextLiked = !liked;
        setLiked(nextLiked);
        setLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

        router.post(`/social/videos/${reel.id}/like`, {}, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                setLiked(liked);
                setLikesCount(reel.likes_count ?? 0);
            },
        });
    }

    const author = reel.author;
    const club = reel.club;
    const controlVisible = showControl || !playing;

    return (
        <article className="mf-reel-slide" data-active={active ? 'true' : 'false'}>
            <video
                ref={videoRef}
                className="mf-reel-slide__video"
                src={reel.video_url}
                poster={reel.thumbnail_url || undefined}
                playsInline
                loop
                muted={muted}
                preload={active || near ? 'auto' : 'metadata'}
                onWaiting={() => setBuffering(true)}
                onPlaying={() => {
                    setBuffering(false);
                    setPlaying(true);
                }}
                onPause={() => setPlaying(false)}
                onClick={togglePlayback}
            />

            {buffering ? <span className="mf-reel-slide__loader" aria-hidden /> : null}

            <div className="mf-reel-slide__scrim" aria-hidden />

            <button
                type="button"
                className={`mf-reel-play ${controlVisible ? 'is-visible' : ''}`}
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={togglePlayback}
            >
                <span className="mf-reel-play__icon" aria-hidden>
                    {playing ? <IconPause /> : <IconPlay />}
                </span>
            </button>

            <div className="mf-reel-slide__meta">
                <div className="mf-reel-slide__copy">
                    {club ? (
                        <span className="mf-reel-slide__club">
                            {club.logo_url ? (
                                <img src={club.logo_url} alt="" className="mf-reel-slide__crest" />
                            ) : null}
                            <span>{club.short || club.name}</span>
                        </span>
                    ) : null}
                    <h2 className="mf-reel-slide__title">{reel.title}</h2>
                    {reel.caption ? <p className="mf-reel-slide__caption">{reel.caption}</p> : null}
                    {author ? (
                        <Link
                            href={`/social/u/${author.handle}`}
                            className="mf-reel-slide__author"
                            prefetch
                            onClick={(event) => event.stopPropagation()}
                        >
                            @{author.handle}
                        </Link>
                    ) : null}
                </div>

                <div className="mf-reel-slide__actions">
                    <button
                        type="button"
                        className={`mf-reel-action ${liked ? 'is-liked' : ''}`}
                        onClick={toggleLike}
                        aria-label={liked ? 'Unlike highlight' : 'Like highlight'}
                    >
                        <span className="mf-reel-action__icon" aria-hidden>{liked ? '♥' : '♡'}</span>
                        <span className="mf-reel-action__count">{formatCount(likesCount)}</span>
                    </button>
                    <button
                        type="button"
                        className="mf-reel-action"
                        onClick={toggleMute}
                        aria-label={muted ? 'Unmute video' : 'Mute video'}
                    >
                        <span className="mf-reel-action__icon" aria-hidden>{muted ? '🔇' : '🔊'}</span>
                        <span className="mf-reel-action__count">{muted ? 'Mute' : 'Sound'}</span>
                    </button>
                    <div className="mf-reel-action mf-reel-action--stat" aria-label={`${formatCount(reel.views_count)} views`}>
                        <span className="mf-reel-action__icon" aria-hidden>👁</span>
                        <span className="mf-reel-action__count">{formatCount(reel.views_count)}</span>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function VideosIndex({ reels, limits }) {
    const items = reels?.items ?? [];
    const page = usePage();
    const flashSuccess = page.props?.flash?.success;
    const [activeIndex, setActiveIndex] = useState(0);
    const [composeOpen, setComposeOpen] = useState(false);
    const scrollerRef = useRef(null);
    const viewSentRef = useRef(new Set());

    const recordView = useCallback((id) => {
        if (viewSentRef.current.has(id)) {
            return;
        }

        viewSentRef.current.add(id);
        router.post(`/social/videos/${id}/view`, {}, {
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    useEffect(() => {
        const root = scrollerRef.current;
        if (!root || items.length === 0) {
            return undefined;
        }

        const slides = root.querySelectorAll('.mf-reel-slide-wrap');
        if (slides.length === 0) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting || entry.intersectionRatio < 0.55) {
                        return;
                    }

                    const index = Number(entry.target.getAttribute('data-index'));
                    if (!Number.isNaN(index)) {
                        setActiveIndex(index);
                    }
                });
            },
            { root, threshold: [0.55, 0.75] },
        );

        slides.forEach((slide) => observer.observe(slide));

        return () => observer.disconnect();
    }, [items.length]);

    return (
        <SocialShell title="Reels">
            <Head title="Reels" />

            <div className="mf-page mf-reels-page">
                <div className="mf-reels-toolbar">
                    <p className="mf-text-meta text-[var(--mf-muted)]">
                        {items.length ? `${items.length} live` : 'Terrace clips'}
                    </p>
                    <button
                        type="button"
                        className="mf-btn mf-btn--pitch mf-reels-toolbar__create"
                        onClick={() => setComposeOpen(true)}
                    >
                        Create
                    </button>
                </div>

                {flashSuccess ? (
                    <p className="mf-text-meta mf-reels-flash" role="status">{flashSuccess}</p>
                ) : null}

                {items.length === 0 ? (
                    <div className="mf-empty mf-empty--feed">
                        <p className="mf-empty-title">No reels yet</p>
                        <p>Publish the first terrace clip, or seed sample Mixkit highlights.</p>
                        <button
                            type="button"
                            className="mf-btn mf-btn--pitch mt-4"
                            onClick={() => setComposeOpen(true)}
                        >
                            Create reel
                        </button>
                    </div>
                ) : (
                    <div ref={scrollerRef} className="mf-reels-scroller" aria-label="Video highlights">
                        {items.map((reel, index) => (
                            <div key={reel.id} className="mf-reel-slide-wrap" data-index={index}>
                                <ReelSlide
                                    reel={reel}
                                    active={index === activeIndex}
                                    near={Math.abs(index - activeIndex) <= 1}
                                    onView={recordView}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateReelSheet
                open={composeOpen}
                onClose={() => setComposeOpen(false)}
                limits={limits}
            />
        </SocialShell>
    );
}
