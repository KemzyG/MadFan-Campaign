import { Head } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { socialApi } from '../../../lib/socialApi';
import { useSocialFlash } from '../optimistic';
import TaskRow from './TaskRow';

/**
 * Daily engagement tasks — post, like, comment, publish a Short, spend time
 * on Stage. Every task's progress is read live from the viewer's own activity
 * (see SocialDailyTaskService), so it's always accurate without a separate
 * "did the thing" flag to keep in sync. Finishing all of them for the day
 * unlocks a one-time points claim; both the task targets and the reward grow
 * a little every calendar week (see DailyTaskCatalog).
 */
export default function DailyTasksIndex({ today }) {
    const { reportError } = useSocialFlash();
    const [state, setState] = useState(today);
    const [claiming, setClaiming] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    function refresh() {
        if (refreshing) {
            return;
        }

        setRefreshing(true);
        socialApi('/tasks')
            .then((data) => {
                if (data?.today) {
                    setState(data.today);
                }
            })
            .catch(() => {})
            .finally(() => setRefreshing(false));
    }

    function claim() {
        if (claiming || state.claimed || !state.all_completed) {
            return;
        }

        setClaiming(true);
        socialApi('/tasks/claim', { method: 'POST' })
            .then((data) => {
                if (data?.today) {
                    setState(data.today);
                }
            })
            .catch((error) => {
                reportError?.(error instanceof Error ? error.message : 'Could not claim your reward.');
                refresh();
            })
            .finally(() => setClaiming(false));
    }

    const claimLabel = state.claimed ? 'Claimed' : claiming ? 'Claiming…' : state.all_completed ? 'Claim reward' : 'Locked';
    const remaining = state.total_count - state.completed_count;
    const statusHint = state.claimed
        ? `Claimed for ${state.week_label.toLowerCase()}`
        : state.all_completed
            ? 'All done — ready to claim'
            : `${remaining} task${remaining === 1 ? '' : 's'} left today`;

    const ringCircumference = 2 * Math.PI * 26;
    const ringProgress = state.total_count > 0 ? state.completed_count / state.total_count : 0;
    const ringOffset = ringCircumference * (1 - ringProgress);

    return (
        <SocialShell title="Daily Tasks" backHref="/social/you">
            <Head title="Daily Tasks" />

            <div className="mf-page mf-tasks">
                <div className="mf-tasks-bar">
                    <span className="mf-tasks-week-chip">{state.week_label}</span>
                    <button
                        type="button"
                        className={`mf-tasks-refresh-btn ${refreshing ? 'is-spinning' : ''}`}
                        onClick={refresh}
                        disabled={refreshing}
                        aria-label="Refresh progress"
                        title="Refresh progress"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.85"
                                d="M4 12a8 8 0 0 1 13.66-5.66M20 12a8 8 0 0 1-13.66 5.66"
                            />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M17 4v4h-4M7 20v-4h4" />
                        </svg>
                    </button>
                </div>

                <section
                    className={`mf-tasks-reward ${state.all_completed ? 'is-ready' : ''} ${
                        state.claimed ? 'is-claimed' : ''
                    }`}
                >
                    <div className="mf-tasks-reward__ring" aria-hidden>
                        <svg viewBox="0 0 64 64">
                            <circle className="mf-tasks-reward__ring-track" cx="32" cy="32" r="26" />
                            <circle
                                className="mf-tasks-reward__ring-fill"
                                cx="32"
                                cy="32"
                                r="26"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={ringOffset}
                            />
                        </svg>
                        <span className="mf-tasks-reward__ring-count">
                            {state.completed_count}/{state.total_count}
                        </span>
                    </div>

                    <div className="mf-tasks-reward__copy">
                        <p className="mf-text-caption mf-tasks-reward__label">Today's reward</p>
                        <p className="mf-tasks-reward__points">
                            +{state.claimed ? state.claimed_points : state.reward_points}
                            <span> pts</span>
                        </p>
                        <p className="mf-text-meta mf-tasks-reward__progress">{statusHint}</p>
                    </div>

                    <button
                        type="button"
                        className="mf-btn mf-btn--pitch mf-tasks-reward__claim"
                        onClick={claim}
                        disabled={claiming || state.claimed || !state.all_completed}
                    >
                        {state.claimed ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m5 13 4 4L19 7" />
                            </svg>
                        ) : null}
                        {claimLabel}
                    </button>
                </section>

                <ul className="mf-tasks-list">
                    {state.tasks.map((task) => (
                        <TaskRow key={task.key} task={task} />
                    ))}
                </ul>
            </div>
        </SocialShell>
    );
}
