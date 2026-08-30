import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import ConnectionStateScreen from '../components/ConnectionStateScreen';
import CommentComposer from '../components/CommentComposer';
import CommentsFeed from '../components/CommentsFeed';
import LiveBadge from '../components/LiveBadge';
import ReactionFab from '../components/ReactionFab';
import ReactionsLayer from '../components/ReactionsLayer';
import ViewerCountBadge from '../components/ViewerCountBadge';
import VideoMount from '../components/VideoMount';
import { useAuthGate } from '../../authGate';
import { useLiveStageSession } from '../LiveStageSessionContext';
import { useLiveStageMedia } from '../useLiveStageMedia';
import { useSwipeLayer } from '../../../../lib/useSwipeLayer';
import { IconBack, IconChat } from '../../Stage/StageIcons';

/**
 * The audience side of a Creator Live — TikTok/Instagram Live shape (spec
 * §10). The video is the one fixed thing on screen, full-bleed, and never
 * moves or gets replaced. Everything else lives in one of two transparent
 * panes stacked on top of it:
 *
 *   front (default) — host header + live/viewer stats + reactions
 *   chat             — the comment feed + composer
 *
 * Swiping right drags "chat" into view and "front" out, 1:1 with the
 * finger — both panes glass, so the video keeps playing right through them.
 * Swiping left (or the header's chat icon / the chat pane's back icon)
 * reverses it. See useSwipeLayer for the drag physics.
 */
export default function CreatorViewer() {
    const { stage, comments, reactions, connection, error, postComment, react } = useLiveStageSession();
    const meId = usePage().props.auth?.user?.id;
    const { requireAuth } = useAuthGate();
    const swipe = useSwipeLayer();

    const { remoteVideoEl, remoteAudioEl, mediaState, mediaError } = useLiveStageMedia({
        stageId: stage.id,
        isHost: false,
        isLive: connection === 'live',
    });

    // A host/moderator action can remove/ban this viewer while they're
    // watching — react immediately rather than waiting for the next poll.
    useEffect(() => {
        const handler = (event) => {
            const targetId = event.detail?.target_user_id;
            const action = event.detail?.action;
            if (meId && Number(targetId) === Number(meId) && (action === 'viewer_removed' || action === 'viewer_banned')) {
                router.visit('/social/live');
            }
        };
        window.addEventListener('live-stage:moderated', handler);
        return () => window.removeEventListener('live-stage:moderated', handler);
    }, [meId]);

    // A guest was never joined as a tracked viewer session (see
    // LiveStageController::show) — there's nothing server-side to leave, so
    // just navigate away instead of POSTing to an auth-only route.
    const leave = () => (meId ? router.post(`/social/live/${stage.id}/leave`) : router.visit('/social/live'));

    const postCommentGated = (body) => {
        if (!requireAuth('comment')) {
            return Promise.resolve();
        }
        return postComment(body);
    };

    const reactGated = (emoji) => {
        if (!requireAuth('react')) {
            return;
        }
        react(emoji);
    };

    if (connection !== 'live') {
        return (
            <div className="kf-reels">
                <ConnectionStateScreen
                    state={connection}
                    error={error}
                    onRetry={() => window.location.reload()}
                    onLeave={() => router.visit('/social/live')}
                />
            </div>
        );
    }

    return (
        <div className="kf-reels">
            <div className="kf-reels__video">
                {remoteVideoEl ? (
                    <VideoMount videoEl={remoteVideoEl} className="kf-reels__video-el" />
                ) : (
                    <div className="kf-reels__video-empty">
                        <p>{mediaState === 'error' ? mediaError || 'Stream unavailable' : 'Waiting for video…'}</p>
                    </div>
                )}
                {remoteAudioEl ? <VideoMount videoEl={remoteAudioEl} className="kf-reels__audio-el" /> : null}
            </div>

            <ReactionsLayer reactions={reactions} />

            {/* The swipe surface — sits over the video, below nothing; both
                panes below are its direct children so they inherit its
                stacking context and drag transforms. touch-action: pan-y lets
                vertical scroll/refresh gestures pass through untouched. */}
            <div
                className={`kf-reels__layers ${swipe.dragging ? 'is-dragging' : ''}`}
                ref={swipe.containerRef}
                {...swipe.handlers}
                style={{ touchAction: 'pan-y' }}
            >
                <div
                    className="kf-reels__layer kf-reels__layer--front"
                    style={swipe.frontStyle}
                    inert={swipe.open}
                >
                    <div className="kf-reels__top">
                        <div className="kf-reels__host">
                            <span className="kf-reels__host-avatar" aria-hidden>
                                {stage.host?.avatar_emoji || '🎥'}
                            </span>
                            <div className="kf-reels__host-meta">
                                <span className="kf-reels__host-name">{stage.host?.name}</span>
                                <span className="kf-reels__title">{stage.title}</span>
                            </div>
                        </div>
                        <div className="kf-reels__stats">
                            <LiveBadge />
                            <ViewerCountBadge count={stage.viewer_count} />
                        </div>
                    </div>

                    <button type="button" className="kf-reels__leave" aria-label="Leave" onClick={leave}>
                        ×
                    </button>

                    <div className="kf-reels__interactions">
                        <button
                            type="button"
                            className="kf-reels__chat-toggle"
                            aria-label="Open chat"
                            onClick={swipe.openChat}
                        >
                            <IconChat />
                            {comments.length > 0 ? (
                                <span className="kf-reels__chat-toggle-count mf-mono">{comments.length}</span>
                            ) : null}
                        </button>
                        <ReactionFab
                            options={stage.reaction_options}
                            onReact={reactGated}
                            disabled={!stage.settings.allow_reactions}
                        />
                    </div>
                </div>

                <div
                    className="kf-reels__layer kf-reels__layer--chat"
                    style={swipe.chatStyle}
                    inert={!swipe.open}
                >
                    <div className="kf-reels__chat-head">
                        <button
                            type="button"
                            className="kf-reels__chat-back"
                            aria-label="Close chat"
                            onClick={swipe.closeChat}
                        >
                            <IconBack />
                        </button>
                        <span className="kf-reels__chat-head-label mf-mono">Chat</span>
                    </div>
                    <CommentsFeed comments={comments} canModerate={false} />
                    <CommentComposer
                        onSubmit={postCommentGated}
                        disabled={!stage.settings.allow_comments}
                        maxLength={stage.max_comment_length}
                    />
                </div>
            </div>
        </div>
    );
}
