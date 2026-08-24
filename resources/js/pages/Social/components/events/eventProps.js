/**
 * Optimistic props patching for the events feed. Cards come from eight
 * different models, so they are addressed by their provider-minted `key`.
 */

/**
 * @param {object} props Current Inertia page props
 * @param {string} key Event card key, e.g. "live_match:12"
 * @param {(event: object) => object} patcher
 */
export function patchEventInProps(props, key, patcher) {
    const data = props?.events?.data;

    if (!Array.isArray(data)) {
        return {};
    }

    return {
        events: {
            ...props.events,
            data: data.map((event) => (event?.key === key ? patcher(event) : event)),
        },
    };
}

/** Patch just the interest block of one card. */
export function setEventInterest(props, key, { active, count }) {
    return patchEventInProps(props, key, (event) => ({
        ...event,
        interest: {
            active,
            count: typeof count === 'function' ? count(event.interest?.count || 0) : count,
        },
    }));
}
