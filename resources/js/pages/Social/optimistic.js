import { createContext, useContext } from 'react';
import { router } from '@inertiajs/react';

export const SocialFlashContext = createContext({
    reportError: () => {},
    reportSuccess: () => {},
    clearError: () => {},
});

export function useSocialFlash() {
    return useContext(SocialFlashContext);
}

export function firstErrorMessage(errors, fallback = 'Action failed — rolled back.') {
    if (!errors || typeof errors !== 'object') {
        return fallback;
    }

    for (const value of Object.values(errors)) {
        if (typeof value === 'string' && value.trim()) {
            return value;
        }
        if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
            return value[0];
        }
    }

    return fallback;
}

/**
 * Wrap Inertia visit options so validation/server failures surface in the shared Social flash.
 */
export function withRollbackFlash(reportError, options = {}, fallback = 'Action failed — rolled back.') {
    return {
        preserveScroll: true,
        ...options,
        onError: (errors) => {
            reportError?.(firstErrorMessage(errors, fallback));
            options.onError?.(errors);
        },
        onSuccess: (...args) => {
            options.onSuccess?.(...args);
        },
    };
}

/**
 * Apply a partial page-props patch without a network visit (Inertia v3 replaceProp).
 *
 * @param {(props: object) => object} mapper
 * @returns {() => void} rollback
 */
export function applyOptimisticProps(mapper) {
    const page = router.page;
    if (!page?.props || typeof mapper !== 'function') {
        return () => {};
    }

    const previous = page.props;
    const patch = mapper(previous) || {};
    const keys = Object.keys(patch);

    if (keys.length === 0) {
        return () => {};
    }

    for (const key of keys) {
        router.replaceProp(key, patch[key]);
    }

    return () => {
        for (const key of keys) {
            router.replaceProp(key, previous[key]);
        }
    };
}

/**
 * Optimistic props patch + JSON mutation + toast. Rolls back props on failure.
 *
 * @param {(props: object) => object | null} mapper
 * @param {() => Promise<object>} mutate
 * @param {{
 *   reportError?: (message: string) => void,
 *   reportSuccess?: (message: string) => void,
 *   successMessage?: string | ((data: object) => string),
 *   errorFallback?: string,
 *   onSuccess?: (data: object) => void,
 *   onError?: (error: Error) => void,
 * }} [options]
 */
export async function runSocialMutation(mapper, mutate, options = {}) {
    const {
        reportError,
        reportSuccess,
        successMessage,
        errorFallback = 'Action failed — rolled back.',
        onSuccess,
        onError,
    } = options;

    const rollback = typeof mapper === 'function' ? applyOptimisticProps(mapper) : () => {};

    try {
        const data = await mutate();
        const message =
            typeof successMessage === 'function'
                ? successMessage(data)
                : successMessage || data?.message;

        if (message) {
            reportSuccess?.(message);
        }

        onSuccess?.(data);

        return data;
    } catch (error) {
        rollback();

        const message =
            error instanceof Error && error.message ? error.message : errorFallback;
        reportError?.(message);
        onError?.(error);

        throw error;
    }
}

function mapList(list, mapFn) {
    if (!Array.isArray(list)) {
        return list;
    }

    return list.map(mapFn);
}

/**
 * Apply a mapper to every post-like list found on the current Social page props.
 */
export function mapPostsInProps(props, mapFn) {
    const next = {};

    if (props.feed?.posts) {
        next.feed = {
            ...props.feed,
            posts: mapList(props.feed.posts, mapFn),
        };
    }

    if (props.post) {
        next.post = mapFn(props.post);
    }

    if (props.replies) {
        next.replies = mapList(props.replies, mapFn);
    }

    return next;
}

export function patchPostInProps(props, postId, patcher) {
    return mapPostsInProps(props, (post) => (post?.id === postId ? patcher(post) : post));
}

export function removePostFromProps(props, postId) {
    const next = {};

    if (props.feed?.posts) {
        next.feed = {
            ...props.feed,
            posts: props.feed.posts.filter((post) => post.id !== postId),
        };
    }

    if (props.replies) {
        next.replies = props.replies.filter((post) => post.id !== postId);
    }

    if (props.post?.id === postId) {
        next.post = props.post;
    }

    return next;
}

export function setAuthorFollowInProps(props, authorId, following) {
    const next = mapPostsInProps(props, (post) =>
        post?.author?.id === authorId
            ? { ...post, viewer_follows_author: following }
            : post,
    );

    if (props.profile?.id === authorId) {
        const delta = following ? 1 : -1;
        next.profile = {
            ...props.profile,
            is_following: following,
            followers_count: Math.max(0, (props.profile.followers_count || 0) + delta),
        };
    }

    return next;
}

export function prependFeedPost(props, pendingPost) {
    if (!props.feed?.posts) {
        return {};
    }

    return {
        feed: {
            ...props.feed,
            posts: [pendingPost, ...props.feed.posts],
        },
    };
}
