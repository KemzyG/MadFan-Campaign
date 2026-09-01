import { AdminPageHeader } from '@/lib/admin-page-header';
import { AdminTable } from '@/lib/admin-table';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import AdminLayout from '../../../Layouts/AdminLayout';
import { formatNumber } from '../../../lib/format';

function StatCard({ label, value, hint }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{formatNumber(value ?? 0)}</CardTitle>
            </CardHeader>
            {hint ? <CardContent className="text-sm text-muted-foreground">{hint}</CardContent> : null}
        </Card>
    );
}

export default function LiveIndex({
    stats = {},
    active_events: activeEvents = [],
    social_stages: socialStages = [],
    live_stages: liveStages = [],
    live_fixtures: liveFixtures = [],
}) {
    return (
        <AdminLayout title="Live ops">
            <AdminPageHeader
                title="Live operations"
                description="What is live right now — stages, fixtures, and feed events."
            />

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Active events" value={stats.active_events_now} hint="From the social events feed" />
                <StatCard label="Social stages live" value={stats.live_social_stages} hint={`${formatNumber(stats.daily_live_participants_today ?? 0)} fans joined live today`} />
                <StatCard label="Broadcast stages live" value={stats.live_broadcast_stages} hint={`${formatNumber(stats.live_fixtures ?? 0)} fixtures in play`} />
            </div>

            <AdminTable
                columns={[
                    { key: 'type', label: 'Type' },
                    { key: 'headline', label: 'Event' },
                    { key: 'status', label: 'Status' },
                    { key: 'club', label: 'Club' },
                ]}
                rows={activeEvents.map((item) => ({
                    id: item.key,
                    type: item.label ?? item.type,
                    headline: item.headline ?? '—',
                    status: (
                        <Badge variant="outline" className="border-red-500/40 text-red-600 dark:text-red-400">
                            {item.pill ?? 'LIVE'}
                        </Badge>
                    ),
                    club: item.club?.name ?? '—',
                }))}
                emptyMessage="No live feed events right now."
                searchPlaceholder="Search events…"
                enableSelection={false}
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <AdminTable
                    columns={[
                        { key: 'title', label: 'Social stage' },
                        { key: 'host', label: 'Host' },
                        { key: 'club', label: 'Club' },
                    ]}
                    rows={socialStages.map((stage) => ({
                        id: `social-${stage.id}`,
                        title: stage.title,
                        host: stage.host ?? '—',
                        club: stage.club ?? '—',
                    }))}
                    emptyMessage="No social stages are live."
                    enableSelection={false}
                />
                <AdminTable
                    columns={[
                        { key: 'title', label: 'Broadcast stage' },
                        { key: 'host', label: 'Host' },
                        { key: 'club', label: 'Club' },
                    ]}
                    rows={liveStages.map((stage) => ({
                        id: `live-${stage.id}`,
                        title: stage.title,
                        host: stage.host ?? '—',
                        club: stage.club ?? '—',
                    }))}
                    emptyMessage="No broadcast stages are live."
                    enableSelection={false}
                />
            </div>

            <div className="mt-6">
                <AdminTable
                    columns={[
                        { key: 'title', label: 'Fixture' },
                        { key: 'competition', label: 'Competition' },
                        { key: 'score', label: 'Score' },
                    ]}
                    rows={liveFixtures.map((fixture) => ({
                        id: fixture.id,
                        title: fixture.title,
                        competition: fixture.competition ?? '—',
                        score: fixture.score ?? '—',
                    }))}
                    emptyMessage="No fixtures are live."
                    enableSelection={false}
                />
            </div>
        </AdminLayout>
    );
}
