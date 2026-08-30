import { useEffect, useId, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { socialApi } from '../../../../lib/socialApi';
import { useAuthGate } from '../../authGate';
import {
    patchPostInProps,
    removePostFromProps,
    runSocialMutation,
    setAuthorFollowInProps,
    useSocialFlash,
    withRollbackFlash,
} from '../../optimistic';
import { IconMore } from './icons';

/**
 * The ⋯ overflow menu: bookmark, copy link, follow, hide, report, delete.
 *
 * @param {{ post: object, onDismiss?: (id:any)=>void }} props
 */
export default function PostOverflowMenu({ post, onDismiss }) {
    const menuId = useId();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const { reportError, reportSuccess } = useSocialFlash();
    const { requireAuth } = useAuthGate();
    const isOwn = Boolean(post.is_own || post.can_delete);
    const bookmarked = Boolean(post.bookmarked_by_viewer);
    const hidden = Boolean(post.hidden_by_viewer);
    const following = Boolean(post.viewer_follows_author);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onPointerDown(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    function run(action, gateAction) {
        setOpen(false);
        if (gateAction && !requireAuth(gateAction)) {
            return;
        }
        action();
    }

    async function copyLink() {
        const url = `${window.location.origin}/social/posts/${post.id}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            window.prompt('Copy link', url);
        }
    }

    return (
        <div className="mf-overflow" ref={rootRef}>
            <button
                type="button"
                className={`mf-overflow__trigger ${open ? 'is-open' : ''}`}
                aria-label="Post actions"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setOpen((value) => !value);
                }}
            >
                <IconMore />
            </button>

            {open ? (
                <ul id={menuId} role="menu" className="mf-overflow__menu" aria-label="Post actions">
                    <li role="none">
                        <button
                            type="button"
                            role="menuitem"
                            className="mf-overflow__item"
                            onClick={() =>
                                run(() => {
                                    const next = !bookmarked;
                                    const visit = router.optimistic((props) =>
                                        patchPostInProps(props, post.id, (item) => ({
                                            ...item,
                                            bookmarked_by_viewer: next,
                                        })),
                                    );
                                    const opts = withRollbackFlash(reportError);

                                    if (bookmarked) {
                                        visit.delete(`/social/posts/${post.id}/bookmark`, opts);
                                        return;
                                    }
                                    visit.post(`/social/posts/${post.id}/bookmark`, {}, opts);
                                }, 'bookmark this post')
                            }
                        >
                            {bookmarked ? 'Remove bookmark' : 'Bookmark'}
                        </button>
                    </li>

                    <li role="none">
                        <button type="button" role="menuitem" className="mf-overflow__item" onClick={() => run(copyLink)}>
                            Copy link
                        </button>
                    </li>

                    {post.can_follow_author ? (
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="mf-overflow__item"
                                onClick={() =>
                                    run(() => {
                                        const authorId = post.author?.id;
                                        if (!authorId) {
                                            return;
                                        }
                                        const next = !following;
                                        void runSocialMutation(
                                            (props) => setAuthorFollowInProps(props, authorId, next),
                                            () =>
                                                socialApi(`/users/${authorId}/follow`, {
                                                    method: following ? 'DELETE' : 'POST',
                                                }),
                                            {
                                                reportError,
                                                reportSuccess,
                                                errorFallback: following
                                                    ? 'Unfollow failed — rolled back.'
                                                    : 'Follow failed — rolled back.',
                                            },
                                        );
                                    }, following ? 'unfollow this fan' : 'follow this fan')
                                }
                            >
                                {following
                                    ? `Unfollow ${post.author?.name || 'fan'}`
                                    : `Follow ${post.author?.name || 'fan'}`}
                            </button>
                        </li>
                    ) : null}

                    {post.can_hide ? (
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="mf-overflow__item"
                                onClick={() =>
                                    run(() => {
                                        if (hidden) {
                                            router
                                                .optimistic((props) =>
                                                    patchPostInProps(props, post.id, (item) => ({
                                                        ...item,
                                                        hidden_by_viewer: false,
                                                    })),
                                                )
                                                .delete(
                                                    `/social/posts/${post.id}/not-interested`,
                                                    withRollbackFlash(reportError),
                                                );
                                            return;
                                        }
                                        onDismiss?.(post.id);
                                        router
                                            .optimistic((props) => removePostFromProps(props, post.id))
                                            .post(
                                                `/social/posts/${post.id}/not-interested`,
                                                {},
                                                withRollbackFlash(reportError, {
                                                    onError: () => {
                                                        /* rollback restores feed; clear local dismiss if used */
                                                    },
                                                }),
                                            );
                                    })
                                }
                            >
                                {hidden ? 'Interested' : 'Not interested'}
                            </button>
                        </li>
                    ) : null}

                    {!isOwn ? (
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="mf-overflow__item is-danger"
                                onClick={() =>
                                    run(() => {
                                        onDismiss?.(post.id);
                                        router
                                            .optimistic((props) => removePostFromProps(props, post.id))
                                            .post(
                                                `/social/posts/${post.id}/report`,
                                                { reason: 'spam' },
                                                withRollbackFlash(reportError),
                                            );
                                    })
                                }
                            >
                                Report
                            </button>
                        </li>
                    ) : null}

                    {post.can_delete ? (
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="mf-overflow__item is-danger"
                                onClick={() =>
                                    run(() => {
                                        onDismiss?.(post.id);
                                        router
                                            .optimistic((props) => removePostFromProps(props, post.id))
                                            .delete(
                                                `/social/posts/${post.id}`,
                                                withRollbackFlash(reportError),
                                            );
                                    })
                                }
                            >
                                Delete
                            </button>
                        </li>
                    ) : null}
                </ul>
            ) : null}
        </div>
    );
}
