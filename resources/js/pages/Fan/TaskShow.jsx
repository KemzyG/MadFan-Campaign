import { Head, Link, usePage } from '@inertiajs/react';
import { socialPlatformIcon } from '../../Components/Fan/socialPlatformIcons';
import TaskCompletionPanel from '../../Components/Fan/TaskCompletionPanel';
import FanLayout from '../../Layouts/FanLayout';

/** A single challenge's own page — reached from the Events feed. */
export default function TaskShow({ task }) {
    const { auth, errors } = usePage().props;
    const defaultHandle = auth?.user?.handle ?? '';
    const { src, alt, dot } = socialPlatformIcon(task.platform);
    const isDone = task.user_progress?.status === 'claimed';

    return (
        <FanLayout>
            <Head title={task.name} />

            <div className="wrap">
                <Link href="/tasks" className="task-back-link">
                    ← All challenges
                </Link>

                {(errors?.external_handle || errors?.proof_url || errors?.proof_image || errors?.task) && (
                    <p className="reg-field-error" style={{ marginBottom: '16px' }}>
                        {errors.external_handle || errors.proof_url || errors.proof_image || errors.task}
                    </p>
                )}

                <div className={`task-card${isDone ? ' completed' : ''}`}>
                    <div className="task-main" style={{ cursor: 'default' }}>
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
                        </div>
                    </div>

                    <TaskCompletionPanel task={task} defaultHandle={defaultHandle} />
                </div>
            </div>
        </FanLayout>
    );
}
