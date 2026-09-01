import { router } from '@inertiajs/react';

export function mergeChatMessage(items, incoming) {
    if (!incoming?.id) {
        return items;
    }

    const exists = items.some((item) => item.id === incoming.id);
    if (exists) {
        return items.map((item) => (item.id === incoming.id ? { ...item, ...incoming } : item));
    }

    return [...items, incoming].sort((a, b) => {
        const aId = typeof a.id === 'number' ? a.id : 0;
        const bId = typeof b.id === 'number' ? b.id : 0;
        if (aId && bId) {
            return aId - bId;
        }

        return String(a.created_at).localeCompare(String(b.created_at));
    });
}

export function markChatMessageDeleted(items, messageId) {
    return items.map((item) =>
        item.id === messageId
            ? {
                ...item,
                body: null,
                media: null,
                deleted: true,
                can_edit: false,
                can_delete: false,
            }
            : item,
    );
}

export function prependChatMessages(items, olderItems) {
    const ids = new Set(items.map((item) => item.id));
    const unique = olderItems.filter((item) => !ids.has(item.id));

    return [...unique, ...items];
}

export function patchChatProps(mapper) {
    router.replace({
        preserveScroll: true,
        preserveState: true,
        props: (current) => {
            const patch = mapper(current) || {};

            return { ...current, ...patch };
        },
    });
}

export function slowmodeSecondsFromError(message) {
    const match = String(message || '').match(/(\d+)\s*second/i);

    return match ? Number(match[1]) : null;
}
