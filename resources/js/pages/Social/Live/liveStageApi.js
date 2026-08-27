/**
 * Thin fetch wrapper for Live Stage actions that must NOT trigger an Inertia
 * page reload — comments, reactions, heartbeat, moderation. All of these are
 * followed by a real-time event (Echo) or local optimistic update, so a full
 * page visit would be redundant and would drop in-flight camera/mic state.
 *
 * Stage creation and start/end DO use Inertia (see CreateSheet.jsx and
 * CreatorStudio.jsx) since those are genuine page-navigation moments.
 */

function csrfHeaders() {
    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    if (match) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(match[1]);
    }
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
        headers['X-CSRF-TOKEN'] = token;
    }
    return headers;
}

async function request(method, url, body) {
    const response = await fetch(url, {
        method,
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const data = await response.json();
            message = data?.message || data?.errors?.[Object.keys(data.errors)[0]]?.[0] || message;
        } catch {
            // ignore — non-JSON error body
        }
        throw new Error(message);
    }

    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('application/json') ? response.json() : null;
}

async function post(url, body) {
    return request('POST', url, body || {});
}

async function del(url) {
    return request('DELETE', url);
}

async function get(url) {
    const response = await fetch(url, {
        headers: csrfHeaders(),
        credentials: 'same-origin',
    });
    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
    }
    return response.json();
}

export function fetchStageState(stageId) {
    return get(`/social/live/${stageId}/state`);
}

export function postComment(stageId, body) {
    return post(`/social/live/${stageId}/comments`, { body });
}

export function deleteComment(stageId, commentId) {
    return del(`/social/live/${stageId}/comments/${commentId}`);
}

export function postReaction(stageId, emoji) {
    return post(`/social/live/${stageId}/reactions`, { emoji });
}

export function heartbeat(stageId) {
    return post(`/social/live/${stageId}/heartbeat`);
}

export function fetchMediaToken(stageId) {
    return get(`/social/live/${stageId}/media-token`);
}

export function muteViewer(stageId, userId, muted) {
    return post(`/social/live/${stageId}/viewers/${userId}/mute`, { muted });
}

export function removeViewer(stageId, userId, ban = false) {
    return post(`/social/live/${stageId}/viewers/${userId}/remove`, { ban });
}
