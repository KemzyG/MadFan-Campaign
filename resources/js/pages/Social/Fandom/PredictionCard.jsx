import { useState } from 'react';
import { socialApi } from '../../../lib/socialApi';

const CHOICES = [
    { key: 'home', label: (fixture) => fixture.home?.short || fixture.home?.name || 'Home' },
    { key: 'draw', label: () => 'Draw' },
    { key: 'away', label: (fixture) => fixture.away?.short || fixture.away?.name || 'Away' },
];

function formatKickoff(iso) {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

/** Predict a fixture's outcome — Home/Draw/Away — for points once it's settled. */
export default function PredictionCard({ prediction }) {
    const [state, setState] = useState(prediction);
    const [pending, setPending] = useState(false);
    const fixture = state.fixture;

    function vote(choice) {
        if (pending || !state.is_open || state.my_choice === choice) {
            return;
        }

        setPending(true);
        const previous = state;
        setState({ ...state, my_choice: choice });

        socialApi(`/predictions/${state.id}/vote`, { method: 'POST', body: { choice } })
            .then((data) => setState(data.prediction))
            .catch(() => setState(previous))
            .finally(() => setPending(false));
    }

    if (!fixture) {
        return null;
    }

    return (
        <div className="mf-fh-activity-card mf-fh-prediction-card">
            <p className="mf-fh-activity-card__kicker">🎯 Prediction · +{state.points_reward} pts</p>
            <p className="mf-fh-prediction-card__matchup">
                {fixture.home?.short || fixture.home?.name} vs {fixture.away?.short || fixture.away?.name}
            </p>
            <p className="mf-fh-activity-card__meta">
                {state.resolved ? 'Final' : formatKickoff(fixture.kickoff_at)}
            </p>

            <div className="mf-fh-prediction-card__choices">
                {CHOICES.map((choice) => {
                    const selected = state.my_choice === choice.key;
                    const correct = state.resolved && state.correct_choice === choice.key;

                    return (
                        <button
                            key={choice.key}
                            type="button"
                            className={`mf-fh-prediction-choice${selected ? ' is-selected' : ''}${correct ? ' is-correct' : ''}`}
                            onClick={() => vote(choice.key)}
                            disabled={pending || !state.is_open}
                        >
                            {choice.label(fixture)}
                        </button>
                    );
                })}
            </div>

            {state.my_result ? (
                <p className={`mf-fh-activity-card__result ${state.my_result.is_correct ? 'is-correct' : 'is-wrong'}`}>
                    {state.my_result.is_correct ? `Correct! +${state.my_result.points_awarded} pts` : 'Not this time'}
                </p>
            ) : !state.is_open && !state.resolved ? (
                <p className="mf-fh-activity-card__result">Predictions closed</p>
            ) : null}
        </div>
    );
}
