import AdminLayout from '../../../Layouts/AdminLayout';
import { OpsDashboardChart } from '@/Components/admin/ops-dashboard-chart';
import { OpsDashboardSectionCards } from '@/Components/admin/ops-dashboard-section-cards';
import { OpsDashboardTables } from '@/Components/admin/ops-dashboard-tables';

export default function MeIndex(props) {
    return (
        <AdminLayout title="My desk">
            <div className="flex flex-col gap-4 md:gap-6">
                <OpsDashboardSectionCards
                    dashboardMode="personal"
                    stats={props.stats}
                    staffProfile={props.staff_profile}
                />
                <div className="px-4 lg:px-6">
                    <OpsDashboardChart
                        dashboardMode="personal"
                        activityTimeline={props.activity_timeline}
                    />
                </div>
                <OpsDashboardTables
                    dashboardMode="personal"
                    trackedAssignments={props.tracked_assignments}
                    activityTimeline={props.activity_timeline}
                />
            </div>
        </AdminLayout>
    );
}
