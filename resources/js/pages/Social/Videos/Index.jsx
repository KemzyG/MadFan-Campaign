import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';

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

function ReelSlide({ reel, active, onView }) {
    const videoRef = useRef(null);
    const [muted, setMuted] = useState(true);
    const [liked, setLiked] = useState(Boolean(reel.liked));
    const [likesCount, setLikesCount] = useState(reel.likes_count ?? 0);
    const viewedRef = useRef(false);

    useEffect(() => {
        setLiked(Boolean(reel.liked));
        setLikesCount(reel.likes_count ?? 0);
        viewedRef.current = false;
    }, [reel.id, reel.liked, reel.likes_count]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) {
            return undefined;
        }

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!active || reducedMotion) {
            video.pause();

            return undefined;
        }

        video.muted = muted;
        const playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }

        if (!viewedRef.current) {
            viewedRef.current = true;
            onView(reel.id);
        }

        return undefined;
    }, [active, muted, onView, reel.id]);

    function toggleMute() {
        setMuted((prev) => !prev);
    }

    function toggleLike() {
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
                preload={active ? 'auto' : 'metadata'}
            />

            <div className="mf-reel-slide__scrim" aria-hidden />

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

export default function VideosIndex({ reels }) {
    const items = reels?.items ?? [];
    const [activeIndex, setActiveIndex] = useState(0);
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

        const slides = root.querySelectorAll('.mf-reel-slide');
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
                {items.length === 0 ? (
                    <div className="mf-empty mf-empty--feed">
                        <p className="mf-empty-title">No reels yet</p>
                        <p>Run the video highlight seeder to load sample clips.</p>
                    </div>
                ) : (
                    <div ref={scrollerRef} className="mf-reels-scroller" aria-label="Video highlights">
                        {items.map((reel, index) => (
                            <div key={reel.id} className="mf-reel-slide-wrap" data-index={index}>
                                <ReelSlide
                                    reel={reel}
                                    active={index === activeIndex}
                                    onView={recordView}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SocialShell>
    );
}
