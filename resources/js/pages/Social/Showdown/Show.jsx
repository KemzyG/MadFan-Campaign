import { Head } from '@inertiajs/react';
import { useRef, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { socialApi } from '../../../lib/socialApi';
import { formatRelative } from '../components/post/format';
import { useSocialFlash } from '../optimistic';

function recompute(state, side) {
    const key = side === 'a' ? 'contestant_a' : 'contestant_b';
    const otherKey = side === 'a' ? 'contestant_b' : 'contestant_a';
    const total = state.total_votes + 1;
    const mine = { ...state[key], votes: state[key].votes + 1 };
    const other = { ...state[otherKey] };
    mine.percent = total > 0 ? Math.round((mine.votes / total) * 100) : 0;
    other.percent = total > 0 ? Math.round((other.votes / total) * 100) : 0;

    return {
        ...state,
        my_side: side,
        my_taps: (state.my_side === side ? state.my_taps : 0) + 1,
        total_votes: total,
        [key]: mine,
        [otherKey]: other,
    };
}

function ContestantAvatar({ contestant, size = 'lg' }) {
    return contestant.avatar_url ? (
        <img src={contestant.avatar_url} alt="" className={`mf-sd-contestant__avatar mf-sd-contestant__avatar--${size}`} />
    ) : (
        <span className={`mf-sd-contestant__avatar mf-sd-contestant__avatar--${size} mf-sd-contestant__avatar--fallback`}>
            {(contestant.name || '?').slice(0, 1).toUpperCase()}
        </span>
    );
}

function ContestantPanel({ contestant, side, mySide, isOpen, onVote }) {
    const isSelected = mySide === side;
    const isLocked = mySide !== null && mySide !== side;

    return (
        <div className={`mf-sd-contestant${isSelected ? ' is-selected' : ''}${isLocked ? ' is-locked' : ''}`}>
            <div className="mf-sd-contestant__frame">
                <ContestantAvatar contestant={contestant} />
                {isLocked ? <span className="mf-sd-contestant__lock" aria-hidden>🔒</span> : null}
            </div>

            {isLocked ? (
                <p className="mf-sd-contestant__unavailable">Unavailable — other side selected</p>
            ) : (
                <>
                    <p className="mf-sd-contestant__votes">{contestant.my_taps ?? 0}</p>
                    <p className="mf-sd-contestant__votes-label">Your votes</p>
                </>
            )}

            <p className="mf-sd-contestant__name">{contestant.name}</p>
            <p className="mf-sd-contestant__handle">@{contestant.handle}</p>

            {!isLocked ? (
                <p className="mf-sd-contestant__total">
                    <span>Total</span>
                    <b>{contestant.votes.toLocaleString()}</b>
                </p>
            ) : null}

            {isSelected ? <span className="mf-sd-contestant__badge">Selected</span> : null}

            {!isLocked && isOpen ? (
                <button type="button" className="mf-sd-contestant__pick" onClick={() => onVote(side)}>
                    {isSelected ? 'Keep voting' : `Back ${contestant.name}`}
                </button>
            ) : null}
        </div>
    );
}

export default function ShowdownShow({ showdown: initialShowdown }) {
    const [state, setState] = useState(initialShowdown);
    const [activity, setActivity] = useState(initialShowdown.recent_activity ?? []);
    const { reportError } = useSocialFlash();
    const requestSeq = useRef(0);

    const a = state.contestant_a;
    const b = state.contestant_b;
    const mySide = state.my_side;
    const myTapsForSide = (side) => (mySide === side ? state.my_taps : 0);

    function vote(side) {
        if (!state.is_open || (mySide !== null && mySide !== side)) {
            return;
        }

        const seq = ++requestSeq.current;
        setState((prev) => recompute(prev, side));
        setActivity((prev) => [
            { id: `optimistic-${seq}`, side, user_name: 'You', created_at: new Date().toISOString() },
            ...prev,
        ].slice(0, 12));

        socialApi(`/showdowns/${state.id}/vote`, { method: 'POST', body: { side } })
            .then((data) => {
                if (seq === requestSeq.current && data?.showdown) {
                    setState(data.showdown);
                    setActivity(data.showdown.recent_activity ?? []);
                }
            })
            .catch(() => {
                reportError('Vote failed to register — refresh to resync.');
            });
    }

    return (
        <SocialShell title="Showdown">
            <Head title={`${state.title} · Mad Fan`} />

            <div className="mf-sd-page">
                <div className="mf-sd-card">
                    <div className="mf-sd-card__eyebrow">
                        <span>Mad Fan | Fan Showdown</span>
                        {!state.is_open ? <span>Closed</span> : null}
                    </div>

                    <div className="mf-sd-matchup">
                        <ContestantPanel
                            contestant={{ ...a, my_taps: myTapsForSide('a') }}
                            side="a"
                            mySide={mySide}
                            isOpen={state.is_open}
                            onVote={vote}
                        />
                        <span className="mf-sd-vs">VS</span>
                        <ContestantPanel
                            contestant={{ ...b, my_taps: myTapsForSide('b') }}
                            side="b"
                            mySide={mySide}
                            isOpen={state.is_open}
                            onVote={vote}
                        />
                    </div>
                </div>

                <div className="mf-sd-tally">
                    <p className="mf-sd-tally__label">Live tally</p>
                    <div className="mf-sd-tally__bar">
                        <span style={{ width: `${a.percent}%` }} />
                    </div>
                    <div className="mf-sd-tally__percents">
                        <span>{a.percent}%</span>
                        <span>{b.percent}%</span>
                    </div>
                </div>

                {mySide && state.is_open ? (
                    <button
                        type="button"
                        className="mf-sd-vote-btn"
                        onClick={() => vote(mySide)}
                    >
                        Tap to vote
                        <span className="mf-sd-vote-btn__badge">+1</span>
                    </button>
                ) : null}

                <p className="mf-sd-hint">
                    Unlimited taps • each tap counts for you and your chosen fan.
                    <br />
                    Switching sides isn't possible once you've picked one.
                </p>

                {activity.length > 0 ? (
                    <div className="mf-sd-activity">
                        <p className="mf-sd-activity__title">Recent activity</p>
                        {activity.map((event) => (
                            <div key={event.id} className="mf-sd-activity__row">
                                <span className="mf-sd-activity__dot" aria-hidden />
                                <span className="mf-sd-activity__text">
                                    {event.user_name === 'You' ? 'You' : event.user_name} voted for{' '}
                                    {event.side === 'a' ? a.name : b.name}
                                    <b> +1</b>
                                </span>
                                <span className="mf-sd-activity__time">{formatRelative(event.created_at)}</span>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </SocialShell>
    );
}
