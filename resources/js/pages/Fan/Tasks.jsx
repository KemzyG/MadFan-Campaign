import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { socialPlatformIcon } from '../../Components/Fan/socialPlatformIcons';
import TaskCompletionPanel from '../../Components/Fan/TaskCompletionPanel';
import FanLayout from '../../Layouts/FanLayout';

export default function Tasks({ tasks = [] }) {
    const { auth, errors } = usePage().props;
    const defaultHandle = auth?.user?.handle ?? '';
    const [filter, setFilter] = useState('all');
    const [openId, setOpenId] = useState(null);

    const filtered = tasks.filter((task) => {
        const status = task.user_progress?.status;
        if (filter === 'pending') return status !== 'claimed';
        if (filter === 'done') return status === 'claimed';
        return true;
    });

    function toggleTask(id, status) {
        if (status === 'claimed') return;
        setOpenId(openId === id ? null : id);
    }

    // Deep link from an event card's "Join challenge" (/tasks?task=123) —
    // open that task's card and scroll it into view, same as tapping it.
    useEffect(() => {
        const taskId = Number(new URLSearchParams(window.location.search).get('task'));
        if (!taskId || !tasks.some((task) => task.id === taskId)) {
            return;
        }

        setOpenId(taskId);
        document.getElementById(`task-${taskId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        const status = task.user_progress?.status;
                        const verificationStatus = task.user_progress?.verification_status;
                        const isDone = status === 'claimed';
                        const isOpen = openId === task.id;
                        const awaitingReview =
                            status === 'confirmed' && verificationStatus === 'pending';

                        return (
                            <div
                                key={task.id}
                                id={`task-${task.id}`}
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
                                <TaskCompletionPanel task={task} defaultHandle={defaultHandle} isOpen={isOpen} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </FanLayout>
    );
}
