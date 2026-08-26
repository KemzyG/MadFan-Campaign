import { IconComment, IconHeart, IconLive } from '../components/post/icons';

function IconPost() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M4 19.5 5 15l10-10a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L9 19l-5 .5Z"
            />
        </svg>
    );
}

function IconVideo() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="3" y="6" width="13" height="12" rx="2.2" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="m16.5 10.2 4-2.4v8.4l-4-2.4" />
        </svg>
    );
}

function IconCheck() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m5 13 4 4L19 7" />
        </svg>
    );
}

const ICONS = {
    post: IconPost,
    like: IconHeart,
    video: IconVideo,
    comment: IconComment,
    stage: IconLive,
};

/** One task: icon, label/description, x-of-y counter, and a progress bar. */
export default function TaskRow({ task }) {
    const Icon = ICONS[task.key] || IconPost;

    return (
        <li className={`mf-task-row ${task.completed ? 'is-complete' : ''}`}>
            <span className="mf-task-row__icon" aria-hidden>
                {task.completed ? <IconCheck /> : <Icon />}
            </span>
            <span className="mf-task-row__body">
                <span className="mf-task-row__top">
                    <span className="mf-task-row__label">{task.label}</span>
                    <span className="mf-mono mf-task-row__count">
                        {task.progress}/{task.target}
                    </span>
                </span>
                <span className="mf-task-row__desc mf-text-meta">{task.description}</span>
                <span
                    className="mf-task-row__track"
                    role="progressbar"
                    aria-valuenow={task.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${task.label} progress`}
                >
                    <span style={{ width: `${task.percent}%` }} />
                </span>
            </span>
        </li>
    );
}
