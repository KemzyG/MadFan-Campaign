import AdminLayout from '../../Layouts/AdminLayout';
import { OpsDashboardChart } from '@/Components/Admin/ops-dashboard-chart';
import { OpsDashboardSectionCards } from '@/Components/Admin/ops-dashboard-section-cards';
import { OpsDashboardTables } from '@/Components/Admin/ops-dashboard-tables';
import { NativeSelect, NativeSelectOption } from '@/Components/ui/native-select';
import { router, usePage } from '@inertiajs/react';
import { adminPath } from '../../lib/adminPath';

export default function Dashboard({
    dashboard_mode: dashboardMode = 'platform',
    chart_days: chartDays = 14,
    stats = {},
    signup_trend: signupTrend = [],
    points_series: pointsSeries = { labels: [], values: [] },
    active_fans_series: activeFansSeries = { labels: [], values: [] },
    posts_series: postsSeries = { labels: [], values: [] },
    engagement_series: engagementSeries = { labels: [], values: [] },
    live_series: liveSeries = { labels: [], values: [] },
    events_series: eventsSeries = { labels: [], values: [] },
    activities_series: activitiesSeries = { labels: [], values: [] },
    active_events: activeEvents = [],
    top_users: topUsers = [],
    recent_activity: recentActivity = [],
    points_by_source: pointsBySource = {},
    source_type_labels: sourceTypeLabels = {},
    tracked_assignments: trackedAssignments = [],
    activity_timeline: activityTimeline = [],
    staff_profile: staffProfile = null,
}) {
    const page = usePage();

    function setChartDays(days) {
        router.get(adminPath(page.props), { days }, { preserveState: true, replace: true });
    }

    return (
        <AdminLayout title="Dashboard">
            <div className="flex flex-col gap-4 md:gap-6">
                {dashboardMode === 'platform' ? (
                    <div className="flex justify-end px-4 lg:px-6">
                        <NativeSelect
                            className="w-36"
                            value={String(chartDays)}
                            onChange={(e) => setChartDays(Number(e.target.value))}
                        >
                            {[7, 14, 21, 30].map((days) => (
                                <NativeSelectOption key={days} value={String(days)}>
                                    Last {days} days
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </div>
                ) : null}
                <OpsDashboardSectionCards
                    dashboardMode={dashboardMode}
                    stats={stats}
                    staffProfile={staffProfile}
                />
                <div className="px-4 lg:px-6">
                    <OpsDashboardChart
                        dashboardMode={dashboardMode}
                        signupTrend={signupTrend}
                        pointsSeries={pointsSeries}
                        activeFansSeries={activeFansSeries}
                        postsSeries={postsSeries}
                        engagementSeries={engagementSeries}
                        liveSeries={liveSeries}
                        eventsSeries={eventsSeries}
                        activitiesSeries={activitiesSeries}
                        activityTimeline={activityTimeline}
                    />
                </div>
                <OpsDashboardTables
                    dashboardMode={dashboardMode}
                    topUsers={topUsers}
                    recentActivity={recentActivity}
                    trackedAssignments={trackedAssignments}
                    activityTimeline={activityTimeline}
                    pointsBySource={pointsBySource}
                    sourceTypeLabels={sourceTypeLabels}
                    activeEvents={activeEvents}
                />
            </div>
        </AdminLayout>
    );
}
