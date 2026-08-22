import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { socialPlatformIcon } from '../../Components/Fan/socialPlatformIcons';
import FanLayout from '../../Layouts/FanLayout';

function TaskStep({ step }) {
    return (
        <div className="task-step">
            <div className="step-num">{String(step.step_number).padStart(2, '0')}</div>
            <div className="step-text">
                {step.description}
                {step.link_url && (
                    <>
                        {' '}
                        <a href={step.link_url} target="_blank" rel="noreferrer">
                            {step.link_label || 'Open'}
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Tasks({ tasks = [] }) {
    const { auth, errors } = usePage().props;
    const defaultHandle = auth?.user?.handle ?? '';
    const [filter, setFilter] = useState('all');
    const [openId, setOpenId] = useState(null);
    const [checked, setChecked] = useState({});
    const [handles, setHandles] = useState({});
    const [proofUrls, setProofUrls] = useState({});
    const [proofImages, setProofImages] = useState({});
    const [submittingId, setSubmittingId] = useState(null);

    const filtered = tasks.filter((task) => {
        const status = task.user_progress?.status;
        if (filter === 'pending') return status !== 'claimed';
        if (filter === 'done') return status === 'claimed';
        return true;
    });

    function taskHandle(task) {
        return handles[task.id] ?? task.user_progress?.external_handle ?? defaultHandle;
    }

    function taskProofUrl(task) {
        return proofUrls[task.id] ?? task.user_progress?.proof_url ?? '';
    }

    function taskProofImage(task) {
        return proofImages[task.id] ?? null;
    }

    function hasProof(task) {
        return (
            taskProofUrl(task).trim().length > 0 ||
            Boolean(taskProofImage(task)) ||
            Boolean(task.user_progress?.proof_image_url)
        );
    }

    function toggleTask(id, status) {
        if (status === 'claimed') return;
        setOpenId(openId === id ? null : id);
    }

    function canCompleteTask(task) {
        const rules = task.completion_rules ?? {};
        const isChecked = checked[task.id] ?? false;

        if (!isChecked) {
            return false;
        }

        if (rules.requires_social_connection && !rules.social_connected) {
            return false;
        }

        if (rules.requires_handle && taskHandle(task).trim().length === 0) {
            return false;
        }

        if (rules.requires_proof && !hasProof(task)) {
            return false;
        }

        return true;
    }

    function completeTask(task) {
        const rules = task.completion_rules ?? {};
        const payload = {};

        if (rules.requires_handle) {
            payload.external_handle = taskHandle(task);
        }

        if (rules.requires_proof || taskProofUrl(task).trim()) {
            payload.proof_url = taskProofUrl(task).trim() || null;
        }

        const image = taskProofImage(task);
        if (image) {
            payload.proof_image = image;
        }

        setSubmittingId(task.id);
        router.post(`/tasks/${task.id}/complete`, payload, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: () => setSubmittingId(null),
            onSuccess: () => {
                setProofImages((current) => {
                    const next = { ...current };
                    delete next[task.id];
                    return next;
                });
            },
        });
    }

    return (
        <FanLayout>
            <Head title="Tasks" />

            <div className="wrap">
                {(errors?.external_handle || errors?.proof_url || errors?.proof_image || errors?.task) && (
                    <p className="reg-field-error" style={{ marginBottom: '16px' }}>
                        {errors.external_handle || errors.proof_url || errors.proof_image || errors.task}
                    </p>
                )}

                <div className="tabs">
                    {['all', 'pending', 'done'].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={`tab${filter === tab ? ' active' : ''}`}
                            onClick={() => setFilter(tab)}
                        >
                            {tab === 'all' ? 'ALL TASKS' : tab === 'pending' ? 'PENDING' : 'COMPLETED'}
                        </button>
                    ))}
                </div>

                <div className="task-list">
                    {filtered.map((task) => {
                        const { src, alt, dot } = socialPlatformIcon(task.platform);
                        const rules = task.completion_rules ?? {};
                        const status = task.user_progress?.status;
                        const verificationStatus = task.user_progress?.verification_status;
                        const isDone = status === 'claimed';
                        const isOpen = openId === task.id;
                        const verificationFailed = verificationStatus === 'failed' || status === 'rejected';
                        const awaitingReview =
                            status === 'confirmed' && verificationStatus === 'pending';
                        const canComplete = canCompleteTask(task) && !awaitingReview;

                        return (
                            <div
                                key={task.id}
                                className={`task-card${isDone ? ' completed' : ''}${awaitingReview ? ' awaiting-review' : ''}`}
                                data-status={status ?? 'pending'}
                            >
                                <div
                                    className="task-main"
                                    onClick={() => toggleTask(task.id, status)}
                                    onKeyDown={() => {}}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="task-platform-icon">
                                        <img
                                            src={src}
                                            alt={alt}
                                            className="task-platform-icon__img"
                                            width={42}
                                            height={42}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <div className={`platform-dot ${dot}`} />
                                    </div>
                                    <div className="task-info">
                                        <div className="task-name">{task.name}</div>
                                        <div className="task-desc">{task.description}</div>
                                    </div>
                                    <div className="task-right">
                                        <div>
                                            <div className="task-pts">{task.points}</div>
                                            <div className="task-pts-label">POINTS</div>
                                        </div>
                                        <div className="task-status-icon">
                                            {isDone ? '✓' : awaitingReview ? '…' : '○'}
                                        </div>
                                    </div>
                                </div>
                                <div className={`task-expand${isOpen ? ' open' : ''}`}>
                                    <div className="task-steps">
                                        {(task.steps ?? []).map((step) => (
                                            <TaskStep key={step.step_number} step={step} />
                                        ))}
                                    </div>
                                    <div className="task-actions">
                                        {task.external_url && (
                                            <a
                                                className="btn-action btn-go"
                                                href={task.external_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {rules.open_button_label ?? '↗ Open task'}
                                            </a>
                                        )}
                                        {!isDone && awaitingReview && (
                                            <div className="connect-inline-banner">
                                                <p>
                                                    Submitted for admin review. Points are awarded after a moderator
                                                    approves this task.
                                                </p>
                                            </div>
                                        )}
                                        {!isDone && !awaitingReview && (
                                            <>
                                                {verificationFailed && task.user_progress?.failure_reason && (
                                                    <p className="reg-field-error" style={{ marginBottom: '12px' }}>
                                                        {task.user_progress.failure_reason}
                                                    </p>
                                                )}
                                                {rules.manual_review && (
                                                    <p className="connect-inline-note" style={{ marginBottom: '12px' }}>
                                                        This task is reviewed manually by MadFan admins after you submit.
                                                    </p>
                                                )}
                                                {rules.requires_social_connection && !rules.social_connected && (
                                                    <div className="connect-inline-banner">
                                                        <p>
                                                            Connect your{' '}
                                                            {(rules.social_platform ?? 'social').toUpperCase()} account
                                                            to verify this task automatically.
                                                        </p>
                                                        {/* Plain anchor: /connect-accounts renders in the dark Social
                                                            shell, needing a full navigation to load its bundle/styles. */}
                                                        <a href="/connect-accounts?manage=1" className="btn-action btn-go">
                                                            CONNECT ACCOUNT
                                                        </a>
                                                    </div>
                                                )}
                                                {rules.social_connected && rules.connected_username && (
                                                    <p className="connect-inline-note">
                                                        Verifying as <strong>{rules.connected_username}</strong>
                                                    </p>
                                                )}
                                                {rules.requires_handle && (
                                                    <div className="reg-field" style={{ marginBottom: '12px' }}>
                                                        <label className="edit-label" htmlFor={`handle-${task.id}`}>
                                                            {(rules.handle_label ?? 'Your profile handle').toUpperCase()}
                                                        </label>
                                                        <input
                                                            id={`handle-${task.id}`}
                                                            className="edit-input"
                                                            type="text"
                                                            placeholder={rules.handle_placeholder ?? '@handle'}
                                                            value={taskHandle(task)}
                                                            onChange={(e) =>
                                                                setHandles({ ...handles, [task.id]: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                )}
                                                {rules.requires_proof && (
                                                    <div className="task-proof-box" style={{ marginBottom: '12px' }}>
                                                        <p className="connect-inline-note" style={{ marginBottom: '10px' }}>
                                                            {rules.proof_hint ??
                                                                'Paste an external URL or upload a screenshot as proof.'}
                                                        </p>
                                                        <div className="reg-field" style={{ marginBottom: '10px' }}>
                                                            <label className="edit-label" htmlFor={`proof-${task.id}`}>
                                                                PROOF URL (PROFILE / POST / PAGE)
                                                            </label>
                                                            <input
                                                                id={`proof-${task.id}`}
                                                                className="edit-input"
                                                                type="url"
                                                                placeholder="https://x.com/yourhandle/status/..."
                                                                value={taskProofUrl(task)}
                                                                onChange={(e) =>
                                                                    setProofUrls({
                                                                        ...proofUrls,
                                                                        [task.id]: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                        <div className="reg-field">
                                                            <label className="edit-label" htmlFor={`proof-img-${task.id}`}>
                                                                OR SCREENSHOT UPLOAD
                                                            </label>
                                                            <input
                                                                id={`proof-img-${task.id}`}
                                                                className="edit-input"
                                                                type="file"
                                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                                onChange={(e) =>
                                                                    setProofImages({
                                                                        ...proofImages,
                                                                        [task.id]: e.target.files?.[0] ?? null,
                                                                    })
                                                                }
                                                            />
                                                            {task.user_progress?.proof_image_url && !taskProofImage(task) ? (
                                                                <p className="connect-inline-note" style={{ marginTop: '8px' }}>
                                                                    Current screenshot on file. Upload a new one to replace it.
                                                                </p>
                                                            ) : null}
                                                            {taskProofImage(task) ? (
                                                                <p className="connect-inline-note" style={{ marginTop: '8px' }}>
                                                                    Selected: {taskProofImage(task).name}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="confirm-check">
                                                    <input
                                                        type="checkbox"
                                                        id={`check-${task.id}`}
                                                        checked={checked[task.id] ?? false}
                                                        onChange={(e) =>
                                                            setChecked({ ...checked, [task.id]: e.target.checked })
                                                        }
                                                    />
                                                    <label htmlFor={`check-${task.id}`} style={{ cursor: 'pointer' }}>
                                                        {rules.confirm_label ?? "I've completed this task"}
                                                    </label>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn-action btn-confirm"
                                                    disabled={!canComplete || submittingId === task.id}
                                                    onClick={() => completeTask(task)}
                                                >
                                                    {submittingId === task.id
                                                        ? 'SUBMITTING…'
                                                        : rules.manual_review
                                                          ? `SUBMIT FOR REVIEW · ${task.points} PTS`
                                                          : `CLAIM ${task.points} PTS`}
                                                </button>
                                            </>
                                        )}
                                        {isDone && (
                                            <button type="button" className="btn-action btn-done">
                                                ✓ CLAIMED
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </FanLayout>
    );
}
