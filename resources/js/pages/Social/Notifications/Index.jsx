import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { socialApi } from '../../../lib/socialApi';
import NotificationRow from './NotificationRow';

/**
 * Every notification for the viewer — likes, replies, tags, chat messages,
 * announcements — newest first. Capped to a single mobile-width column, same
 * as the Leaderboard: this is a phone-first list, not a desktop dashboard.
 */
export default function NotificationsIndex({ notifications, unread_count: unreadCount = 0 }) {
    const [readIds, setReadIds] = useState(() => new Set());
    const [markingAll, setMarkingAll] = useState(false);

    const items = notifications?.data ?? [];
    const remainingUnread = Math.max(0, unreadCount - readIds.size);

    function markRead(id) {
        setReadIds((prev) => new Set(prev).add(id));
    }

    function markAllRead() {
        if (markingAll || remainingUnread === 0) {
            return;
        }

        setMarkingAll(true);
        socialApi('/notifications/read-all', { method: 'POST' })
            .then(() => {
                setReadIds(new Set(items.map((item) => item.id)));
                router.reload({ only: ['notifications', 'unread_count'], preserveScroll: true });
            })
            .catch(() => {})
            .finally(() => setMarkingAll(false));
    }

    return (
        <SocialShell title="Notifications">
            <Head title="Notifications — Mad Fan Social" />

            <div className="mf-notif">
                <div className="mf-notif-bar">
                    <p className="mf-notif-bar__count mf-text-meta">
                        {remainingUnread > 0
                            ? `${remainingUnread} unread`
                            : 'You’re all caught up'}
                    </p>
                    {remainingUnread > 0 ? (
                        <button
                            type="button"
                            className="mf-notif-bar__mark-all"
                            onClick={markAllRead}
                            disabled={markingAll}
                        >
                            {markingAll ? 'Marking…' : 'Mark all read'}
                        </button>
                    ) : null}
                </div>

                {items.length === 0 ? (
                    <div className="mf-empty mf-empty--compact">
                        <p className="mf-empty-title">Nothing yet</p>
                        <p>Likes, replies, tags and messages will land here.</p>
                    </div>
                ) : (
                    <section className="mf-notif-card">
                        <ul className="mf-notif-list">
                            {items.map((notification) => (
                                <NotificationRow
                                    key={notification.id}
                                    notification={{
                                        ...notification,
                                        read: notification.read || readIds.has(notification.id),
                                    }}
                                    onRead={markRead}
                                />
                            ))}
                        </ul>
                    </section>
                )}

                {notifications?.links?.next ? (
                    <div className="mf-feed-more">
                        <Link href={notifications.links.next} className="mf-btn mf-btn--ghost" preserveScroll>
                            Load more
                        </Link>
                    </div>
                ) : null}
            </div>
        </SocialShell>
    );
}
