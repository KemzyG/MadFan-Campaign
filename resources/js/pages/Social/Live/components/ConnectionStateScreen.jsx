/**
 * Full-surface state screens for the five non-live connection states (spec
 * §19/§20) — a viewer/host must never stare at a blank video element while
 * something is wrong or pending.
 */
export default function ConnectionStateScreen({ state, error, onRetry, onLeave }) {
    if (state === 'live') {
        return null;
    }

    const copy = {
        loading: {
            title: 'Connecting…',
            body: 'Loading this live stage.',
        },
        waiting: {
            title: "The host hasn't started yet",
            body: 'Hang tight — this screen updates the moment they go live.',
        },
        reconnecting: {
            title: 'Connection interrupted',
            body: 'Reconnecting…',
        },
        ended: {
            title: 'This live stage has ended',
            body: 'Thanks for watching.',
        },
        error: {
            title: 'Unable to connect',
            body: error || 'Something went wrong reaching this live stage.',
        },
    }[state] || { title: 'Loading…', body: '' };

    return (
        <div className="kf-connection-screen" role="status">
            <div className="kf-connection-screen__ring" aria-hidden>
                {state === 'reconnecting' || state === 'loading' ? (
                    <span className="kf-connection-screen__spinner" />
                ) : null}
            </div>
            <h2 className="kf-connection-screen__title">{copy.title}</h2>
            {copy.body ? <p className="kf-connection-screen__body">{copy.body}</p> : null}
            <div className="kf-connection-screen__actions">
                {state === 'error' && onRetry ? (
                    <button type="button" className="kf-form__btn kf-form__btn--primary" onClick={onRetry}>
                        Retry
                    </button>
                ) : null}
                {(state === 'ended' || state === 'error') && onLeave ? (
                    <button type="button" className="kf-form__btn" onClick={onLeave}>
                        Back to Live
                    </button>
                ) : null}
            </div>
        </div>
    );
}
