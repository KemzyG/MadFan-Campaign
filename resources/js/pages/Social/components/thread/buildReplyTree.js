/**
 * Build a nested reply tree from the flat `replies` array.
 *
 * Each reply carries `reply_to_id` (its direct parent) and `root_id` (the thread
 * root). Top-level replies point at the thread root; anything whose parent is not
 * present in the set (e.g. beyond the server cap) is adopted at the top level so
 * nothing silently disappears.
 *
 * @param {Array} replies - flat list of reply posts
 * @param {any} rootId - id of the thread root post
 * @returns {Array} top-level nodes, each shaped `{ ...reply, depth, children: [] }`
 */
export function buildReplyTree(replies, rootId) {
    const list = Array.isArray(replies) ? replies : [];
    const nodes = new Map();

    for (const reply of list) {
        if (reply && reply.id != null) {
            nodes.set(reply.id, { ...reply, children: [] });
        }
    }

    const roots = [];

    for (const reply of list) {
        if (!reply || reply.id == null) {
            continue;
        }

        const node = nodes.get(reply.id);
        const parentId = reply.reply_to_id;
        const parent =
            parentId != null && parentId !== reply.id && parentId !== rootId
                ? nodes.get(parentId)
                : null;

        if (parent) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    }

    // Stamp depth for indentation/aria, guarding against unexpected cycles.
    const stampDepth = (node, depth, seen) => {
        node.depth = depth;
        if (seen.has(node.id)) {
            node.children = [];
            return;
        }
        seen.add(node.id);
        node.children.forEach((child) => stampDepth(child, depth + 1, seen));
    };

    roots.forEach((node) => stampDepth(node, 0, new Set()));

    return roots;
}
