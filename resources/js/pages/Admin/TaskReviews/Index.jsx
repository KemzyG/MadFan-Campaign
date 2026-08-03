import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import Modal from '../../../Components/Admin/Modal';
import DataTable from '../../../Components/DataTable';
import FilterBar from '../../../Components/FilterBar';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { adminPath } from '../../../lib/adminPath';
import { formatDateTime, formatNumber } from '../../../lib/format';

const platformVariant = {
    x: 'brand',
    twitter: 'brand',
    discord: 'default',
    telegram: 'default',
    general: 'warning',
};

function EvidenceLink({ href, children }) {
    if (!href) {
        return <span className="text-zinc-500">—</span>;
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="break-all text-brand-400 hover:text-brand-300"
        >
            {children ?? href}
        </a>
    );
}

function ReviewDetailPanel({ review, onClose, base }) {
    const [verified, setVerified] = useState(false);
    const [mode, setMode] = useState('review');
    const rejectForm = useForm({ reason: '' });
    const [approving, setApproving] = useState(false);
    const awaiting = review.awaiting_review;

    function approve() {
        if (!verified || approving) {
            return;
        }

        setApproving(true);
        router.post(
            `${base}/task-reviews/${review.id}/approve`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setApproving(false),
                onSuccess: () => onClose(),
            },
        );
    }

    function submitReject(e) {
        e.preventDefault();
        rejectForm.post(`${base}/task-reviews/${review.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    const task = review.task ?? {};
    const user = review.user ?? {};
    const socialAccounts = user.social_accounts ?? [];
    const steps = task.steps ?? [];

    return (
        <Modal
            title={awaiting ? 'Review task submission' : 'Submission details'}
            onClose={onClose}
            wide
            footer={
                awaiting && mode === 'review' ? (
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('reject')}
                            className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300 ring-1 ring-red-500/30 hover:bg-red-500/25"
                        >
                            Reject
                        </button>
                        <button
                            type="button"
                            onClick={approve}
                            disabled={!verified || approving}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-surface-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {approving ? 'Approving…' : 'Approve & award points'}
                        </button>
                    </>
                ) : null
            }
        >
            <div className="space-y-5 text-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                    <section className="rounded-xl border border-white/10 bg-surface-900/50 p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Task</h4>
                        <p className="mt-2 font-medium text-white">{task.name ?? '—'}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {task.code ?? '—'} · {formatNumber(task.points ?? 0)} pts ·{' '}
                            {(task.task_type ?? 'task').replace(/_/g, ' ')}
                        </p>
                        <div className="mt-2">
                            <Badge variant={platformVariant[task.platform] ?? 'default'}>
                                {(task.platform ?? 'general').toUpperCase()}
                            </Badge>
                        </div>
                        {task.description ? (
                            <p className="mt-3 whitespace-pre-wrap text-zinc-300">{task.description}</p>
                        ) : (
                            <p className="mt-3 text-zinc-500">No task description provided.</p>
                        )}
                        <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium text-zinc-500">Expected destination</p>
                            <EvidenceLink href={task.external_url} />
                        </div>
                        {steps.length > 0 ? (
                            <ol className="mt-3 list-decimal space-y-1 pl-4 text-zinc-300">
                                {steps.map((step) => (
                                    <li key={step.step_number}>
                                        {step.description}
                                        {step.link_url ? (
                                            <span className="ml-1">
                                                (
                                                <EvidenceLink href={step.link_url}>
                                                    {step.link_label || 'open'}
                                                </EvidenceLink>
                                                )
                                            </span>
                                        ) : null}
                                    </li>
                                ))}
                            </ol>
                        ) : null}
                    </section>

                    <section className="rounded-xl border border-white/10 bg-surface-900/50 p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Fan</h4>
                        <p className="mt-2 font-medium text-white">{user.name ?? '—'}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {user.email}
                            {user.fan_id ? ` · ${user.fan_id}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">Profile handle: {user.handle || '—'}</p>
                        <div className="mt-3">
                            <p className="text-xs font-medium text-zinc-500">Connected social accounts</p>
                            {socialAccounts.length === 0 ? (
                                <p className="mt-1 text-zinc-500">None connected</p>
                            ) : (
                                <ul className="mt-1 space-y-1">
                                    {socialAccounts.map((account) => (
                                        <li key={`${account.platform}-${account.platform_user_id}`}>
                                            <span className="font-medium text-zinc-200">
                                                {(account.platform ?? '').toUpperCase()}
                                            </span>
                                            <span className="text-zinc-400">
                                                {' '}
                                                · @{account.username || account.platform_user_id || '—'}
                                                {account.display_name ? ` (${account.display_name})` : ''}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="mt-3 text-xs text-zinc-500">
                            Submitted {formatDateTime(review.confirmed_at ?? review.updated_at)}
                        </div>
                    </section>
                </div>

                <section className="rounded-xl border border-white/10 bg-surface-900/50 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Submitted evidence
                    </h4>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs text-zinc-500">External handle</dt>
                            <dd className="mt-0.5 text-zinc-200">{review.external_handle || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-zinc-500">Post / content ID</dt>
                            <dd className="mt-0.5 text-zinc-200">{review.external_post_id || '—'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-xs text-zinc-500">Proof URL (profile / post / page)</dt>
                            <dd className="mt-0.5">
                                <EvidenceLink href={review.proof_url} />
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-xs text-zinc-500">Screenshot</dt>
                            <dd className="mt-2">
                                {review.proof_image_url ? (
                                    <a href={review.proof_image_url} target="_blank" rel="noreferrer" className="block">
                                        <img
                                            src={review.proof_image_url}
                                            alt="Task proof screenshot"
                                            className="max-h-72 w-full rounded-lg border border-white/10 object-contain bg-black/30"
                                        />
                                    </a>
                                ) : (
                                    <span className="text-zinc-500">No screenshot uploaded</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                    {review.is_rejected && review.failure_reason ? (
                        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-red-300 ring-1 ring-red-500/20">
                            Rejected: {review.failure_reason}
                        </p>
                    ) : null}
                    {!review.has_proof ? (
                        <p className="mt-3 text-amber-300/90">
                            No proof URL or screenshot — ask the fan to resubmit with evidence before approving.
                        </p>
                    ) : null}
                </section>

                {awaiting && mode === 'review' ? (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={verified}
                            onChange={(e) => setVerified(e.target.checked)}
                            className="mt-0.5 rounded border-white/20 bg-surface-700 text-emerald-500"
                        />
                        <span className="text-sm text-zinc-200">
                            I checked the expected destination / proof and this submission looks valid.
                        </span>
                    </label>
                ) : null}

                {awaiting && mode === 'reject' ? (
                    <form onSubmit={submitReject} className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        <h4 className="font-medium text-white">Reject submission</h4>
                        <p className="text-xs text-zinc-400">Tell the fan why this task was rejected.</p>
                        <textarea
                            className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-zinc-100"
                            rows={4}
                            value={rejectForm.data.reason}
                            onChange={(e) => rejectForm.setData('reason', e.target.value)}
                            placeholder="e.g. Could not find your follow / post."
                            required
                        />
                        {rejectForm.errors.reason ? (
                            <p className="text-xs text-red-300">{rejectForm.errors.reason}</p>
                        ) : null}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setMode('review')}
                                className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={rejectForm.processing}
                                className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                Confirm reject
                            </button>
                        </div>
                    </form>
                ) : null}
            </div>
        </Modal>
    );
}

export default function TaskReviewsIndex({
    reviews,
    pending_count: pendingCount = 0,
    rejected_count: rejectedCount = 0,
    filters,
    platforms = [],
    tasks = [],
}) {
    const page = usePage();
    const base = adminPath(page.props);
    const [selected, setSelected] = useState(null);
    const status = filters?.status ?? 'pending';

    const columns = [
        { key: 'user', label: 'Fan' },
        { key: 'task', label: 'Task' },
        { key: 'platform', label: 'Platform' },
        { key: 'proof', label: 'Proof / handle' },
        { key: 'submitted', label: 'Submitted' },
        { key: 'actions', label: '' },
    ];

    const rows = (reviews?.data ?? []).map((row) => {
        const awaiting = row.awaiting_review;
        const rejected = row.is_rejected;

        return {
            ...row,
            user: (
                <div>
                    <div className="font-medium text-zinc-100">{row.user?.name ?? '—'}</div>
                    <div className="text-xs text-zinc-500">
                        {row.user?.email}
                        {row.user?.fan_id ? ` · ${row.user.fan_id}` : ''}
                    </div>
                </div>
            ),
            task: (
                <div>
                    <div className="font-medium text-zinc-100">{row.task?.name ?? '—'}</div>
                    <div className="text-xs text-zinc-500">
                        {row.task?.code ?? '—'} · {formatNumber(row.task?.points ?? 0)} pts
                    </div>
                </div>
            ),
            platform: (
                <Badge variant={platformVariant[row.task?.platform] ?? 'default'}>
                    {(row.task?.platform ?? 'general').toUpperCase()}
                </Badge>
            ),
            proof: (
                <div className="max-w-xs space-y-1 text-sm text-zinc-300">
                    <div>{row.external_handle || row.user?.handle || '—'}</div>
                    {row.proof_url ? (
                        <a
                            href={row.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-brand-400 hover:text-brand-300"
                        >
                            {row.proof_url}
                        </a>
                    ) : null}
                    {row.proof_image_url ? (
                        <a
                            href={row.proof_image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300"
                        >
                            <img
                                src={row.proof_image_url}
                                alt=""
                                className="h-8 w-8 rounded object-cover ring-1 ring-white/10"
                            />
                            Screenshot
                        </a>
                    ) : null}
                    {!row.proof_url && !row.proof_image_url ? (
                        <div className="text-xs text-amber-400/80">No proof yet</div>
                    ) : null}
                    {rejected && row.failure_reason ? (
                        <div className="text-xs text-red-300/90">{row.failure_reason}</div>
                    ) : null}
                </div>
            ),
            submitted: formatDateTime(row.confirmed_at ?? row.updated_at),
            actions: (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setSelected(row)}
                        className="rounded-md bg-brand-500/15 px-2.5 py-1 text-xs font-semibold text-brand-300 ring-1 ring-brand-500/30 hover:bg-brand-500/25"
                    >
                        {awaiting ? 'Review' : 'View'}
                    </button>
                    {!awaiting ? (
                        <Badge variant={rejected ? 'danger' : 'default'}>
                            {rejected ? 'Rejected' : row.verification_status}
                        </Badge>
                    ) : null}
                </div>
            ),
        };
    });

    return (
        <AdminLayout title="Task reviews">
            <PageHeader
                title="Task reviews"
                description="Open each submission, check the expected destination and evidence, then approve or reject."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30">
                            {pendingCount} pending
                        </span>
                        <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">
                            {rejectedCount} rejected
                        </span>
                    </div>
                }
            />

            <div className="mb-4 flex flex-wrap gap-2">
                {[
                    { value: 'pending', label: 'Pending' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'all', label: 'All' },
                ].map((tab) => (
                    <Link
                        key={tab.value}
                        href={`${base}/task-reviews?status=${tab.value}`}
                        className={`rounded-lg px-3 py-1.5 text-sm transition ${
                            status === tab.value
                                ? 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30'
                                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            <FilterBar
                route={`${base}/task-reviews`}
                filters={filters}
                fields={[
                    { name: 'search', label: 'Search', placeholder: 'User, task, handle, proof…' },
                    {
                        name: 'platform',
                        label: 'Platform',
                        type: 'select',
                        options: platforms.map((platform) => ({
                            value: platform,
                            label: platform.toUpperCase(),
                        })),
                    },
                    {
                        name: 'task_id',
                        label: 'Task',
                        type: 'select',
                        options: tasks.map((task) => ({
                            value: String(task.id),
                            label: `${task.name} (${task.code})`,
                        })),
                    },
                    {
                        name: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'pending', label: 'Pending' },
                            { value: 'rejected', label: 'Rejected' },
                            { value: 'all', label: 'All' },
                        ],
                    },
                ]}
            />

            {rows.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-surface-800/60 p-8 text-center text-sm text-zinc-400">
                    No task submissions match your filters.
                </div>
            ) : (
                <DataTable columns={columns} rows={rows} />
            )}

            <Pagination links={reviews?.links} meta={reviews} />

            {selected ? (
                <ReviewDetailPanel
                    key={selected.id}
                    review={selected}
                    base={base}
                    onClose={() => setSelected(null)}
                />
            ) : null}
        </AdminLayout>
    );
}
