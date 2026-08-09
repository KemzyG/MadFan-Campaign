import { Head, useForm } from '@inertiajs/react';

export default function PickClub({ clubs = [], current_club_id: currentClubId }) {
    const { data, setData, post, processing, errors } = useForm({
        club_id: currentClubId ?? '',
    });

    function submit(e) {
        e.preventDefault();
        post('/social/onboarding/club');
    }

    return (
        <div className="mf-stage">
            <div className="mf-onboard">
                <Head title="Pick your club" />

                <p className="mf-text-caption text-[var(--mf-pitch)]">
                    Mad Fan Social
                </p>
                <p className="mf-display mf-text-display mt-2 text-[var(--mf-text)]">
                    Choose your terrace
                </p>
                <p className="mf-text-ui mt-2 max-w-md text-[var(--mf-muted)]">
                    Every fan is club-first. This becomes your home feed, chat rooms, and loyalty board.
                </p>

                <form onSubmit={submit} className="mt-8">
                    <div className="grid max-h-[min(52vh,28rem)] gap-2 overflow-y-auto pe-1 sm:max-h-none sm:grid-cols-2">
                        {clubs.map((club) => {
                            const selected = String(data.club_id) === String(club.id);

                            return (
                                <button
                                    key={club.id}
                                    type="button"
                                    onClick={() => setData('club_id', club.id)}
                                    className={`mf-club-opt ${selected ? 'is-selected' : ''}`}
                                    aria-pressed={selected}
                                >
                                    {club.logo_url ? (
                                        <img src={club.logo_url} alt="" className="mf-avatar h-10 w-10" />
                                    ) : (
                                        <span className="mf-avatar mf-text-meta h-10 w-10">
                                            {(club.short || club.name || '?').slice(0, 2)}
                                        </span>
                                    )}
                                    <span className="min-w-0">
                                        <span className="mf-text-ui block truncate font-semibold text-[var(--mf-text)]">
                                            {club.name}
                                        </span>
                                        <span className="mf-text-meta block truncate text-[var(--mf-muted)]">
                                            {club.league || 'Football'}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {errors.club_id ? <p className="mf-text-ui mt-3 text-[var(--mf-rival)]">{errors.club_id}</p> : null}

                    <button
                        type="submit"
                        disabled={processing || !data.club_id}
                        className="mf-btn mf-btn--pitch mt-8 w-full sm:w-auto sm:min-w-[14rem]"
                    >
                        {processing ? 'Saving…' : 'Enter the terrace'}
                    </button>
                </form>
            </div>
        </div>
    );
}
