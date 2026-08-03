import { Head, Link, router, usePage } from '@inertiajs/react';
import FanLayout from '../../Layouts/FanLayout';

function MetricCard({ label, value }) {
    return (
        <div className="staff-metric-card">
            <div className="staff-metric-label">{label}</div>
            <div className="staff-metric-value">{value}</div>
        </div>
    );
}

export default function Staff({ staff, performance, tasks = [], fan }) {
    const { flash } = usePage().props;

    function confirmTask(taskId) {
        router.post(`/tasks/${taskId}/confirm`, {}, { preserveScroll: true });
    }

    return (
        <FanLayout>
            <Head title="Staff Dashboard" />

            <div className="wrap">
                <div className="page-header">
                    <div className="page-eye">Staff Operations</div>
                    <h1 className="page-title">YOUR STAFF ROLE</h1>
                    <p className="page-sub">
                        {staff?.position_description ??
                            'Complete assigned responsibilities and track your staff performance.'}
                    </p>
                </div>

                {flash?.success && <div className="flash-success">{flash.success}</div>}
                {flash?.error && <div className="flash-error">{flash.error}</div>}

                <section className="staff-profile-card">
                    <div className="staff-profile-grid">
                        <div>
                            <div className="staff-profile-label">Position</div>
                            <div className="staff-profile-value">{staff?.position_label ?? 'N/A'}</div>
                        </div>
                        <div>
                            <div className="staff-profile-label">Status</div>
                            <div className="staff-profile-value">{staff?.status_label ?? 'N/A'}</div>
                        </div>
                        <div>
                            <div className="staff-profile-label">Assigned</div>
                            <div className="staff-profile-value">
                                {staff?.assigned_at ? new Date(staff.assigned_at).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div className="staff-profile-label">Assigned By</div>
                            <div className="staff-profile-value">{staff?.assigned_by?.name ?? 'N/A'}</div>
                        </div>
                    </div>
                </section>

                <section className="staff-metrics-grid">
                    <MetricCard label="Performance Score" value={performance?.performance_score ?? 0} />
                    <MetricCard label="Staff Rank" value={`#${performance?.staff_rank ?? 'N/A'}`} />
                    <MetricCard label="Total Points" value={Number(performance?.total_points ?? 0).toLocaleString()} />
                    <MetricCard label="Referrals" value={performance?.total_referrals ?? 0} />
                    <MetricCard label="Completed Tasks" value={performance?.completed_tasks ?? 0} />
                    <MetricCard label="Pending Tasks" value={performance?.pending_tasks ?? 0} />
                    <MetricCard label="Daily Claims Today" value={performance?.daily_claims_today ?? 0} />
                    <MetricCard label="Weekly Claims" value={performance?.weekly_claims ?? 0} />
                </section>

                <section className="staff-tasks-section">
                    <div className="section-eye">Assigned Responsibilities</div>
                    <div className="section-title">STAFF TASKS</div>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '540px', marginBottom: '20px' }}>
                        Tasks assigned to your staff position or directly to you by administrators.
                    </p>

                    {tasks.length === 0 ? (
                        <div className="staff-empty-state">No staff tasks are assigned to you right now.</div>
                    ) : (
                        <div className="staff-task-list">
                            {tasks.map((task) => {
                                const status = task.user_progress?.status ?? 'not_started';
                                const isComplete = status === 'claimed' || status === 'completed';

                                return (
                                    <article key={task.id} className="staff-task-card">
                                        <div className="staff-task-head">
                                            <div>
                                                <div className="staff-task-type">{task.task_type ?? 'Staff Task'}</div>
                                                <h3 className="staff-task-title">{task.name}</h3>
                                            </div>
                                            <div className="staff-task-points">+{task.points} PTS</div>
                                        </div>
                                        <p className="staff-task-desc">{task.description}</p>
                                        <div className="staff-task-meta">
                                            <span>Status: {status.replace('_', ' ')}</span>
                                            {task.staff_position && <span>Position: {task.staff_position}</span>}
                                        </div>
                                        <div className="staff-task-actions">
                                            {!isComplete && (
                                                <button
                                                    type="button"
                                                    className="btn-action btn-confirm"
                                                    onClick={() => confirmTask(task.id)}
                                                >
                                                    {status === 'confirmed' ? 'Ready to claim' : 'Accept task'}
                                                </button>
                                            )}
                                            {status === 'confirmed' && (
                                                <Link href="/tasks" className="btn-action btn-go">
                                                    Continue in tasks
                                                </Link>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </FanLayout>
    );
}
