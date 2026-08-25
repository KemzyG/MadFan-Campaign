import { Head, Link, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { useSocialFlash, withRollbackFlash } from '../optimistic';

// How many upcoming shorts get `preload="auto"` ahead of the one on screen,
// so they're already buffered and ready to play the instant a scroll lands
// on them rather than starting a fetch at that moment.
const PRELOAD_AHEAD = 5;

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

function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds || 0));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * React doesn't reliably apply the `muted` JSX attribute to the underlying
 * DOM property before the browser evaluates `autoPlay` — a callback ref sets
 * it the instant the node mounts, ahead of that check, so autoplay never
 * starts with sound.
 */
function muteOnMount(node) {
    if (node) {
        node.muted = true;
    }
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

function IconBack() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6 9 12l6 6" />
        </svg>
    );
}

function IconPlus() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12h14" />
        </svg>
    );
}

function IconHeart({ filled }) {
    return (
        <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={filled ? 0 : 1.8}
                d="M12 20.1c-.3 0-.6-.1-.85-.32-2-1.77-3.9-3.46-5.37-5.03C4.03 12.9 3 11.2 3 9.35 3 6.95 4.95 5 7.35 5c1.4 0 2.72.68 3.63 1.83.24.3.7.3.94 0C12.83 5.68 14.15 5 15.55 5 17.95 5 19.9 6.95 19.9 9.35c0 1.85-1.03 3.55-2.78 5.4-1.47 1.57-3.37 3.26-5.37 5.03-.25.22-.55.32-.85.32Z"
            />
        </svg>
    );
}

function IconVolumeOff() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 9.5v5h3.4L12 18.2V5.8L7.4 9.5H4Z" />
            <path strokeLinecap="round" strokeWidth="1.8" d="m16 9 4.6 6M20.6 9 16 15" />
        </svg>
    );
}

function IconVolumeOn() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 9.5v5h3.4L12 18.2V5.8L7.4 9.5H4Z" />
            <path strokeLinecap="round" strokeWidth="1.8" d="M16.1 9.3a4 4 0 0 1 0 5.4M18.5 7a7.3 7.3 0 0 1 0 10" />
        </svg>
    );
}

function IconEye() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.5 12S5.8 5.6 12 5.6 21.5 12 21.5 12 18.2 18.4 12 18.4 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="2.6" strokeWidth="1.8" />
        </svg>
    );
}

function IconUploadCloud() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
                d="M7.6 17.4a4 4 0 0 1-.7-7.93A5.5 5.5 0 0 1 17.4 8.5a4.25 4.25 0 0 1-.4 8.9H7.6Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M12 10v6.4M9.4 12.6 12 10l2.6 2.6" />
        </svg>
    );
}

function IconTrash() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M5 7h14M9.5 7V5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M7.5 7l.7 11.2a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4L17 7"
            />
        </svg>
    );
}

function CreateReelSheet({ open, onClose, limits }) {
    const titleId = useId();
    const { reportError } = useSocialFlash();
    const maxTitle = 120;
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
    const fileInputRef = useRef(null);

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

    function clearVideo(event) {
        event.stopPropagation();
        setData('video', null);
        setData('duration_seconds', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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

    const durationTooLong = Boolean(data.duration_seconds) && data.duration_seconds > maxDuration;
    const canPublish = Boolean(data.video) && !processing && !durationTooLong;

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
                                New short
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
                            <label className={`mf-reel-create__picker ${previewUrl ? 'has-video' : ''}`}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/mp4,video/webm"
                                    className="hidden"
                                    onChange={onPickVideo}
                                    disabled={processing}
                                />
                                {previewUrl ? (
                                    <>
                                        <video
                                            ref={muteOnMount}
                                            className="mf-reel-create__preview"
                                            src={previewUrl}
                                            muted
                                            playsInline
                                            loop
                                            autoPlay
                                        />
                                        <span className="mf-reel-create__scrim" aria-hidden />
                                        {data.duration_seconds ? (
                                            <span
                                                className={`mf-reel-create__duration ${durationTooLong ? 'is-over' : ''}`}
                                            >
                                                {formatDuration(data.duration_seconds)}
                                            </span>
                                        ) : null}
                                        {!processing ? (
                                            <button
                                                type="button"
                                                className="mf-reel-create__remove"
                                                onClick={clearVideo}
                                                aria-label="Remove clip"
                                            >
                                                <IconTrash />
                                            </button>
                                        ) : null}
                                    </>
                                ) : (
                                    <span className="mf-reel-create__placeholder">
                                        <span className="mf-reel-create__placeholder-icon" aria-hidden>
                                            <IconUploadCloud />
                                        </span>
                                        <span className="mf-reel-create__placeholder-title">Tap to choose a clip</span>
                                        <span className="mf-reel-create__placeholder-hint">MP4 or WEBM</span>
                                    </span>
                                )}
                            </label>
                            {errors.video ? <p className="mf-field-error">{errors.video}</p> : null}
                            {durationTooLong ? (
                                <p className="mf-field-error">
                                    {formatDuration(data.duration_seconds)} is over the {maxDuration}s limit.
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
                                    maxLength={maxTitle}
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Derby day clip"
                                    disabled={processing}
                                />
                                <div className="mf-stage-create-field__foot">
                                    {errors.title ? <p className="mf-field-error">{errors.title}</p> : <span />}
                                    <span className="mf-stage-create-field__count">
                                        {data.title.length}/{maxTitle}
                                    </span>
                                </div>
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
                                <div className="mf-stage-create-field__foot">
                                    {errors.caption ? <p className="mf-field-error">{errors.caption}</p> : <span />}
                                    <span className="mf-stage-create-field__count">
                                        {data.caption.length}/{maxCaption}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="mf-stage-create-modal__footer">
                        {progress ? (
                            <div className="mf-reel-create__progress" role="progressbar" aria-valuenow={progress.percentage} aria-valuemin={0} aria-valuemax={100}>
                                <span className="mf-reel-create__progress-fill" style={{ width: `${progress.percentage}%` }} />
                                <span className="mf-reel-create__progress-label">Uploading… {progress.percentage}%</span>
                            </div>
                        ) : null}
                        <button type="submit" className="mf-btn mf-btn--pitch w-full" disabled={!canPublish}>
                            {processing ? 'Publishing…' : 'Publish short'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ReelSlide({ reel, active, eagerLoad, onView }) {
    const videoRef = useRef(null);
    const [muted, setMuted] = useState(false);
    const [liked, setLiked] = useState(Boolean(reel.liked));
    const [likesCount, setLikesCount] = useState(reel.likes_count ?? 0);
    const [playing, setPlaying] = useState(false);
    const [showControl, setShowControl] = useState(false);
    const [buffering, setBuffering] = useState(true);
    const [likeBurst, setLikeBurst] = useState(false);
    const controlTimerRef = useRef(null);
    const burstTimerRef = useRef(null);
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
        if (burstTimerRef.current) {
            window.clearTimeout(burstTimerRef.current);
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
                .catch(() => {
                    // Autoplay-with-sound is blocked in some browsers without a
                    // prior user gesture on the page. Fall back to muted so the
                    // short still plays instead of sitting frozen on its poster.
                    if (!muted) {
                        video.muted = true;
                        setMuted(true);
                        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
                        return;
                    }
                    setPlaying(false);
                });
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

        if (nextLiked) {
            setLikeBurst(true);
            if (burstTimerRef.current) {
                window.clearTimeout(burstTimerRef.current);
            }
            burstTimerRef.current = window.setTimeout(() => setLikeBurst(false), 500);
        }

        router.post(`/social/videos/${reel.id}/like`, {}, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                setLiked(liked);
                setLikesCount(reel.likes_count ?? 0);
            },
        });
    }

    function onDoubleTap(event) {
        if (!liked) {
            toggleLike(event);
        } else {
            togglePlayback(event);
        }
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
                preload={active || eagerLoad ? 'auto' : 'metadata'}
                onWaiting={() => setBuffering(true)}
                onPlaying={() => {
                    setBuffering(false);
                    setPlaying(true);
                }}
                onPause={() => setPlaying(false)}
                onClick={togglePlayback}
                onDoubleClick={onDoubleTap}
            />

            {buffering ? <span className="mf-reel-slide__loader" aria-hidden /> : null}

            <div className="mf-reel-slide__scrim" aria-hidden />

            {likeBurst ? (
                <span className="mf-reel-like-burst" aria-hidden>
                    <IconHeart filled />
                </span>
            ) : null}

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
                        aria-label={liked ? 'Unlike short' : 'Like short'}
                    >
                        <span className="mf-reel-action__icon" aria-hidden>
                            <IconHeart filled={liked} />
                        </span>
                        <span className="mf-reel-action__count">{formatCount(likesCount)}</span>
                    </button>
                    <button
                        type="button"
                        className="mf-reel-action"
                        onClick={toggleMute}
                        aria-label={muted ? 'Unmute video' : 'Mute video'}
                    >
                        <span className="mf-reel-action__icon" aria-hidden>
                            {muted ? <IconVolumeOff /> : <IconVolumeOn />}
                        </span>
                        <span className="mf-reel-action__count">{muted ? 'Mute' : 'Sound'}</span>
                    </button>
                    <div className="mf-reel-action mf-reel-action--stat" aria-label={`${formatCount(reel.views_count)} views`}>
                        <span className="mf-reel-action__icon" aria-hidden>
                            <IconEye />
                        </span>
                        <span className="mf-reel-action__count">{formatCount(reel.views_count)}</span>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function VideosIndex({ reels, limits }) {
    const items = reels?.items ?? [];
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

        // Shrinking the observed root to a 0-height line at its vertical
        // centre (via rootMargin) means "intersecting" only becomes true the
        // instant a slide's box crosses dead centre — the same trick every
        // centre-triggered autoplay feed uses, rather than an arbitrary
        // percent-visible threshold that could fire before a slide is
        // actually the one in focus.
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    const index = Number(entry.target.getAttribute('data-index'));
                    if (!Number.isNaN(index)) {
                        setActiveIndex(index);
                    }
                });
            },
            { root, rootMargin: '-50% 0px -50% 0px', threshold: 0 },
        );

        slides.forEach((slide) => observer.observe(slide));

        return () => observer.disconnect();
    }, [items.length]);

    return (
        <SocialShell title="Shorts" mobileBare>
            <Head title="Shorts" />

            <div className="mf-page mf-reels-page">
                <div className="mf-reels-topbar">
                    <Link href="/social" className="mf-reels-topbar__back" aria-label="Back">
                        <IconBack />
                    </Link>
                    {items.length ? (
                        <span className="mf-reels-topbar__count">{items.length} live</span>
                    ) : null}
                    <button
                        type="button"
                        className="mf-reels-topbar__create"
                        onClick={() => setComposeOpen(true)}
                        aria-label="Create a short"
                    >
                        <IconPlus />
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="mf-empty mf-empty--feed mf-reels-empty">
                        <p className="mf-empty-title">No shorts yet</p>
                        <p>Publish the first terrace clip, or seed sample Mixkit highlights.</p>
                        <button
                            type="button"
                            className="mf-btn mf-btn--pitch mt-4"
                            onClick={() => setComposeOpen(true)}
                        >
                            Create short
                        </button>
                    </div>
                ) : (
                    <div ref={scrollerRef} className="mf-reels-scroller" aria-label="Video highlights">
                        {items.map((reel, index) => (
                            <div key={reel.id} className="mf-reel-slide-wrap" data-index={index}>
                                <ReelSlide
                                    reel={reel}
                                    active={index === activeIndex}
                                    eagerLoad={index >= activeIndex - 1 && index <= activeIndex + PRELOAD_AHEAD}
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
