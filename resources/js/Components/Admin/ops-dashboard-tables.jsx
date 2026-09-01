import { Link, usePage } from '@inertiajs/react';
import { Badge } from '@/Components/ui/badge';
import { AdminTable } from '@/lib/admin-table';
import { formatDateTime, formatNumber } from '@/lib/format';
import { adminPath } from '@/lib/adminPath';
import { adminBadgeClass, adminBadgeVariant } from '@/lib/admin-badge';

function adminEventHref(pageProps, item) {
    const base = adminPath(pageProps);
    const [type, id] = String(item.key ?? '').split(':');

    if (!id) {
        return null;
    }

    const routes = {
        live_match: `${base}/fixtures`,
        livestream: `${base}/stages`,
        live_event: `${base}/stages`,
        tournament: `${base}/fixtures`,
        new_episode: `${base}/stages`,
        campaign: `${base}/seasons`,
        fan_challenge: `${base}/tasks`,
        showdown: `${base}/showdowns`,
        vote: `${base}/polls`,
        concert: `${base}/announcements`,
        song_release: `${base}/announcements`,
        breaking_news: `${base}/announcements`,
    };

    return routes[type] ?? null;
}

export function OpsDashboardTables({
    dashboardMode,
    topUsers = [],
    recentActivity = [],
    trackedAssignments = [],
    activityTimeline = [],
    sourceTypeLabels = {},
    pointsBySource = {},
    activeEvents = [],
}) {
    const page = usePage();

    if (dashboardMode === 'personal') {
        const assignmentRows = trackedAssignments.map((task) => ({
            id: task.id,
            task: (
                <div>
                    <div className="font-medium">{task.name}</div>
                    <div className="text-xs text-muted-foreground">{task.code}</div>
                </div>
            ),
            assignment: task.assignment_label ?? '—',
            status: (
                <Badge variant={adminBadgeVariant(task.status)} className={adminBadgeClass(task.status)}>
                    {String(task.status ?? 'not_started').replaceAll('_', ' ')}
                </Badge>
            ),
            points: formatNumber(task.points_awarded ?? task.points ?? 0),
        }));

        const timelineRows = activityTimeline.map((item, index) => ({
            id: `${item.event}-${index}`,
            when: formatDateTime(item.occurred_at),
            title: item.title ?? item.event,
            detail: item.description ?? '—',
            status: item.status ? (
                <Badge variant="secondary">{String(item.status).replaceAll('_', ' ')}</Badge>
            ) : (
                '—'
            ),
        }));

        return (
            <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
                <AdminTable
                    columns={[
                        { key: 'task', label: 'Task' },
                        { key: 'assignment', label: 'Assignment' },
                        { key: 'status', label: 'Status' },
                        { key: 'points', label: 'Points' },
                    ]}
                    rows={assignmentRows}
                    emptyMessage="No tracked assignments yet."
                    searchPlaceholder="Search assignments…"
                />
                <AdminTable
                    columns={[
                        { key: 'when', label: 'When' },
                        { key: 'title', label: 'Event' },
                        { key: 'detail', label: 'Detail' },
                        { key: 'status', label: 'Status' },
                    ]}
                    rows={timelineRows}
                    emptyMessage="No recent activity."
                    searchPlaceholder="Search activity…"
                />
            </div>
        );
    }

    const userRows = topUsers.map((user) => ({
        id: user.id,
        fan: (
            <div>
                <Link
                    href={adminPath(page.props, `users/${user.id}`)}
                    className="font-medium text-primary hover:underline"
                >
                    {user.name}
                </Link>
                <div className="text-xs text-muted-foreground">@{user.username ?? '—'} · {user.fan_id ?? '—'}</div>
            </div>
        ),
        email: user.email ?? '—',
        points: formatNumber(user.total_points ?? 0),
    }));

    const activityRows = recentActivity.map((log) => ({
        id: log.id,
        event: log.event ?? '—',
        description: log.description ?? '—',
        actor: log.user?.name ?? 'System',
        when: formatDateTime(log.created_at),
    }));

    const sourceRows = Object.entries(pointsBySource ?? {})
        .map(([source, total]) => ({
            id: source,
            source: sourceTypeLabels[source] ?? source.replaceAll('_', ' '),
            points: formatNumber(total),
            sortTotal: Number(total),
        }))
        .sort((a, b) => b.sortTotal - a.sortTotal)
        .map(({ sortTotal: _sortTotal, ...row }) => row);

    const activeEventRows = activeEvents.map((item) => {
        const href = adminEventHref(page.props, item);

        return {
            id: item.key,
            type: item.label ?? item.type?.replaceAll('_', ' ') ?? 'Event',
            headline: href ? (
                <Link href={href} className="font-medium text-primary underline-offset-2 hover:underline">
                    {item.headline ?? '—'}
                </Link>
            ) : (
                item.headline ?? '—'
            ),
            status: (
                <Badge variant="outline" className="border-red-500/40 text-red-600 dark:text-red-400">
                    {item.pill ?? 'LIVE'}
                </Badge>
            ),
            club: item.club?.name ?? '—',
        };
    });

    return (
        <div className="grid gap-4 px-4 lg:px-6">
            <AdminTable
                columns={[
                    { key: 'type', label: 'Type' },
                    { key: 'headline', label: "Today's active events" },
                    { key: 'status', label: 'Status' },
                    { key: 'club', label: 'Club' },
                ]}
                rows={activeEventRows}
                emptyMessage="No live events right now."
                searchPlaceholder="Search active events…"
                enableSelection={false}
            />
            <div className="grid gap-4 lg:grid-cols-2">
                <AdminTable
                    columns={[
                        { key: 'fan', label: 'Top fans' },
                        { key: 'email', label: 'Email' },
                        { key: 'points', label: 'Points' },
                    ]}
                    rows={userRows}
                    emptyMessage="No fan accounts yet."
                    searchPlaceholder="Search top fans…"
                />
                <AdminTable
                    columns={[
                        { key: 'source', label: 'Points source' },
                        { key: 'points', label: '30-day total' },
                    ]}
                    rows={sourceRows}
                    emptyMessage="No point activity in the last 30 days."
                    searchPlaceholder="Search sources…"
                    enableSelection={false}
                />
            </div>
            <AdminTable
                columns={[
                    { key: 'event', label: 'Event' },
                    { key: 'description', label: 'Description' },
                    { key: 'actor', label: 'Actor' },
                    { key: 'when', label: 'When' },
                ]}
                rows={activityRows}
                emptyMessage="No recent platform activity."
                searchPlaceholder="Search activity logs…"
            />
        </div>
    );
}
