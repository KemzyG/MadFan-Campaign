import { adminBadgeClass, adminBadgeVariant } from '@/lib/admin-badge';
import { AdminFilterBar } from '@/lib/admin-filter-bar';
import { AdminPageHeader } from '@/lib/admin-page-header';
import { AdminPagination } from '@/lib/admin-pagination';
import { AdminTable } from '@/lib/admin-table';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Field, FieldLabel } from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/Components/ui/native-select';
import { Textarea } from '@/Components/ui/textarea';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import AdminLayout from '../../../Layouts/AdminLayout';
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
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <a href={href} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
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
        <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{awaiting ? 'Review task submission' : 'Submission details'}</DialogTitle>
                </DialogHeader>
            <div className="space-y-5 text-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardContent className="p-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Task</h4>
                            <p className="mt-2 font-medium">{task.name ?? '—'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {task.code ?? '—'} · {formatNumber(task.points ?? 0)} pts ·{' '}
                                {(task.task_type ?? 'task').replace(/_/g, ' ')}
                            </p>
                            <div className="mt-2">
                                <Badge variant={adminBadgeVariant(platformVariant[task.platform] ?? 'default')} className={adminBadgeClass(platformVariant[task.platform] ?? 'default')}>
                                    {(task.platform ?? 'general').toUpperCase()}
                                </Badge>
                            </div>
                            {task.description ? (
                                <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{task.description}</p>
                            ) : (
                                <p className="mt-3 text-muted-foreground">No task description provided.</p>
                            )}
                            <div className="mt-3 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Expected destination</p>
                                <EvidenceLink href={task.external_url} />
                            </div>
                            {steps.length > 0 ? (
                                <ol className="mt-3 list-decimal space-y-1 pl-4">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fan</h4>
                            <p className="mt-2 font-medium">{user.name ?? '—'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {user.email}
                                {user.fan_id ? ` · ${user.fan_id}` : ''}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">Profile handle: {user.handle || '—'}</p>
                            <div className="mt-3">
                                <p className="text-xs font-medium text-muted-foreground">Connected social accounts</p>
                                {socialAccounts.length === 0 ? (
                                    <p className="mt-1 text-muted-foreground">None connected</p>
                                ) : (
                                    <ul className="mt-1 space-y-1">
                                        {socialAccounts.map((account) => (
                                            <li key={`${account.platform}-${account.platform_user_id}`}>
                                                <span className="font-medium">
                                                    {(account.platform ?? '').toUpperCase()}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {' '}
                                                    · @{account.username || account.platform_user_id || '—'}
                                                    {account.display_name ? ` (${account.display_name})` : ''}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground">
                                Submitted {formatDateTime(review.confirmed_at ?? review.updated_at)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Submitted evidence
                        </h4>
                        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs text-muted-foreground">External handle</dt>
                                <dd className="mt-0.5">{review.external_handle || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">Post / content ID</dt>
                                <dd className="mt-0.5">{review.external_post_id || '—'}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs text-muted-foreground">Proof URL (profile / post / page)</dt>
                                <dd className="mt-0.5">
                                    <EvidenceLink href={review.proof_url} />
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs text-muted-foreground">Screenshot</dt>
                                <dd className="mt-2">
                                    {review.proof_image_url ? (
                                        <a href={review.proof_image_url} target="_blank" rel="noreferrer" className="block">
                                            <img
                                                src={review.proof_image_url}
                                                alt="Task proof screenshot"
                                                className="max-h-72 w-full rounded-lg border border-border object-contain bg-muted/30"
                                            />
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">No screenshot uploaded</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                        {review.is_rejected && review.failure_reason ? (
                            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
                                Rejected: {review.failure_reason}
                            </p>
                        ) : null}
                        {!review.has_proof ? (
                            <p className="mt-3 text-amber-700 dark:text-amber-300">
                                No proof URL or screenshot — ask the fan to resubmit with evidence before approving.
                            </p>
                        ) : null}
                    </CardContent>
                </Card>

                {awaiting && mode === 'review' ? (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={verified}
                            onChange={(e) => setVerified(e.target.checked)}
                            className="mt-0.5 rounded border-input"
                        />
                        <span className="text-sm">
                            I checked the expected destination / proof and this submission looks valid.
                        </span>
                    </label>
                ) : null}

                {awaiting && mode === 'reject' ? (
                    <form onSubmit={submitReject} className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                        <h4 className="font-medium">Reject submission</h4>
                        <p className="text-xs text-muted-foreground">Tell the fan why this task was rejected.</p>
                        <Textarea
                            rows={4}
                            value={rejectForm.data.reason}
                            onChange={(e) => rejectForm.setData('reason', e.target.value)}
                            placeholder="e.g. Could not find your follow / post."
                            required
                        />
                        {rejectForm.errors.reason ? (
                            <p className="text-xs text-destructive">{rejectForm.errors.reason}</p>
                        ) : null}
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setMode('review')}>
                                Back
                            </Button>
                            <Button type="submit" variant="destructive" disabled={rejectForm.processing}>
                                Confirm reject
                            </Button>
                        </div>
                    </form>
                ) : null}

                {awaiting && mode === 'review' ? (
                    <div className="flex justify-end gap-2 border-t border-border pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Close
                        </Button>
                        <Button type="button" variant="outline" className="text-destructive" onClick={() => setMode('reject')}>
                            Reject
                        </Button>
                        <Button type="button" onClick={approve} disabled={!verified || approving}>
                            {approving ? 'Approving…' : 'Approve & award points'}
                        </Button>
                    </div>
                ) : null}
            </div>
        </DialogContent></Dialog>
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
                    <div className="font-medium">{row.user?.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.user?.email}
                        {row.user?.fan_id ? ` · ${row.user.fan_id}` : ''}
                    </div>
                </div>
            ),
            task: (
                <div>
                    <div className="font-medium">{row.task?.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.task?.code ?? '—'} · {formatNumber(row.task?.points ?? 0)} pts
                    </div>
                </div>
            ),
            platform: (
                <Badge variant={adminBadgeVariant(platformVariant[row.task?.platform] ?? 'default')} className={adminBadgeClass(platformVariant[row.task?.platform] ?? 'default')}>
                    {(row.task?.platform ?? 'general').toUpperCase()}
                </Badge>
            ),
            proof: (
                <div className="max-w-xs space-y-1 text-sm">
                    <div>{row.external_handle || row.user?.handle || '—'}</div>
                    {row.proof_url ? (
                        <a
                            href={row.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-primary hover:underline"
                        >
                            {row.proof_url}
                        </a>
                    ) : null}
                    {row.proof_image_url ? (
                        <a
                            href={row.proof_image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                            <img
                                src={row.proof_image_url}
                                alt=""
                                className="h-8 w-8 rounded object-cover ring-1 ring-border"
                            />
                            Screenshot
                        </a>
                    ) : null}
                    {!row.proof_url && !row.proof_image_url ? (
                        <div className="text-xs text-amber-700 dark:text-amber-300">No proof yet</div>
                    ) : null}
                    {rejected && row.failure_reason ? (
                        <div className="text-xs text-destructive">{row.failure_reason}</div>
                    ) : null}
                </div>
            ),
            submitted: formatDateTime(row.confirmed_at ?? row.updated_at),
            actions: (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="outline" size="sm" type="button" onClick={() => setSelected(row)}>
                        {awaiting ? 'Review' : 'View'}
                    </Button>
                    {!awaiting ? (
                        <Badge variant={adminBadgeVariant(rejected ? 'danger' : 'default')} className={adminBadgeClass(rejected ? 'danger' : 'default')}>
                            {rejected ? 'Rejected' : row.verification_status}
                        </Badge>
                    ) : null}
                </div>
            ),
        };
    });

    return (
        <AdminLayout title="Task reviews">
            <AdminPageHeader
                title="Task reviews"
                description="Open each submission, check the expected destination and evidence, then approve or reject."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">{pendingCount} pending</Badge>
                        <Badge variant="destructive">{rejectedCount} rejected</Badge>
                    </div>
                }
            />

            <div className="mb-4 flex flex-wrap gap-2">
                {[
                    { value: 'pending', label: 'Pending' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'all', label: 'All' },
                ].map((tab) => (
                    <Button
                        key={tab.value}
                        variant={status === tab.value ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link href={`${base}/task-reviews?status=${tab.value}`}>{tab.label}</Link>
                    </Button>
                ))}
            </div>

            <AdminFilterBar
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

            <AdminTable columns={columns} rows={rows} emptyMessage="No task submissions match your filters." />

            <AdminPagination links={reviews?.links} meta={reviews} />

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
