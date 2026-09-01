import { router } from '@inertiajs/react';
import { useState } from 'react';

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

/**
 * The steps + proof/confirm/claim form for a single task. Self-contained —
 * owns its own draft state and posts straight to /tasks/{id}/complete — so it
 * can be dropped into the task list (Fan/Tasks.jsx) or the task's own page
 * (Fan/TaskShow.jsx) identically.
 */
export default function TaskCompletionPanel({ task, defaultHandle = '', isOpen = true }) {
    const [checked, setChecked] = useState(false);
    const [handle, setHandle] = useState(task.user_progress?.external_handle ?? defaultHandle);
    const [proofUrl, setProofUrl] = useState(task.user_progress?.proof_url ?? '');
    const [proofImage, setProofImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const rules = task.completion_rules ?? {};
    const status = task.user_progress?.status;
    const verificationStatus = task.user_progress?.verification_status;
    const isDone = status === 'claimed';
    const verificationFailed = verificationStatus === 'failed' || status === 'rejected';
    const awaitingReview = status === 'confirmed' && verificationStatus === 'pending';

    function hasProof() {
        return proofUrl.trim().length > 0 || Boolean(proofImage) || Boolean(task.user_progress?.proof_image_url);
    }

    function canComplete() {
        if (!checked) {
            return false;
        }
        if (rules.requires_social_connection && !rules.social_connected) {
            return false;
        }
        if (rules.requires_handle && handle.trim().length === 0) {
            return false;
        }
        if (rules.requires_proof && !hasProof()) {
            return false;
        }
        return true;
    }

    function complete() {
        const payload = {};

        if (rules.requires_handle) {
            payload.external_handle = handle;
        }
        if (rules.requires_proof || proofUrl.trim()) {
            payload.proof_url = proofUrl.trim() || null;
        }
        if (proofImage) {
            payload.proof_image = proofImage;
        }

        setSubmitting(true);
        router.post(`/tasks/${task.id}/complete`, payload, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: () => setSubmitting(false),
            onSuccess: () => setProofImage(null),
        });
    }

    return (
        <div className={`task-expand${isOpen ? ' open' : ''}`}>
            <div className="task-steps">
                {(task.steps ?? []).map((step) => (
                    <TaskStep key={step.step_number} step={step} />
                ))}
            </div>
            <div className="task-actions">
                {task.external_url && (
                    <a className="btn-action btn-go" href={task.external_url} target="_blank" rel="noreferrer">
                        {rules.open_button_label ?? '↗ Open task'}
                    </a>
                )}
                {!isDone && awaitingReview && (
                    <div className="connect-inline-banner">
                        <p>Submitted for admin review. Points are awarded after a moderator approves this task.</p>
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
                                    Connect your {(rules.social_platform ?? 'social').toUpperCase()} account to verify
                                    this task automatically.
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
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value)}
                                />
                            </div>
                        )}
                        {rules.requires_proof && (
                            <div className="task-proof-box" style={{ marginBottom: '12px' }}>
                                <p className="connect-inline-note" style={{ marginBottom: '10px' }}>
                                    {rules.proof_hint ?? 'Paste an external URL or upload a screenshot as proof.'}
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
                                        value={proofUrl}
                                        onChange={(e) => setProofUrl(e.target.value)}
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
                                        onChange={(e) => setProofImage(e.target.files?.[0] ?? null)}
                                    />
                                    {task.user_progress?.proof_image_url && !proofImage ? (
                                        <p className="connect-inline-note" style={{ marginTop: '8px' }}>
                                            Current screenshot on file. Upload a new one to replace it.
                                        </p>
                                    ) : null}
                                    {proofImage ? (
                                        <p className="connect-inline-note" style={{ marginTop: '8px' }}>
                                            Selected: {proofImage.name}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        )}
                        <div className="confirm-check">
                            <input
                                type="checkbox"
                                id={`check-${task.id}`}
                                checked={checked}
                                onChange={(e) => setChecked(e.target.checked)}
                            />
                            <label htmlFor={`check-${task.id}`} style={{ cursor: 'pointer' }}>
                                {rules.confirm_label ?? "I've completed this task"}
                            </label>
                        </div>
                        <button
                            type="button"
                            className="btn-action btn-confirm"
                            disabled={!canComplete() || submitting}
                            onClick={complete}
                        >
                            {submitting
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
    );
}
