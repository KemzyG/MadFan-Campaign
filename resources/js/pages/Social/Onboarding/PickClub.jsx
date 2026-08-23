import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';
import ToastStack from '../../../Components/Fan/ToastStack';
import { groupClubsByLeague } from '../../../lib/groupClubsByLeague';
import { useToasts } from '../../../lib/useToasts';

export default function PickClub({ clubs = [], current_club_id: currentClubId }) {
    const { data, setData, post, processing, errors } = useForm({
        club_id: currentClubId ?? '',
    });
    const { toasts, pushToast, dismissToast } = useToasts();
    const groupedClubs = useMemo(() => groupClubsByLeague(clubs), [clubs]);

    useEffect(() => {
        if (errors.club_id) {
            pushToast('err', errors.club_id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errors.club_id]);

    function submit(e) {
        e.preventDefault();
        post('/social/onboarding/club');
    }

    return (
        <div className="mf-auth-stage">
            <Head title="Pick your club" />
            <ToastStack toasts={toasts} onDismiss={dismissToast} />

            <div className="mf-onboard-panel">
                <div className="mf-auth-header">
                    <div className="mf-auth-brand">
                        <FanBrandLogo asLink={false} size={30} className="mf-auth-brand-mark" />
                        <span>Mad Fan</span>
                    </div>
                    <h1 className="mf-auth-title">Choose your club</h1>
                </div>

                <form onSubmit={submit}>
                    <div className="max-h-[min(52vh,28rem)] overflow-y-auto pe-1 sm:max-h-none">
                        {groupedClubs.map(([league, leagueClubs]) => (
                            <div key={league} className="mf-auth-league-group">
                                <p className="mf-auth-league-label">{league}</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {leagueClubs.map((club) => {
                                        const selected = String(data.club_id) === String(club.id);

                                        return (
                                            <button
                                                key={club.id}
                                                type="button"
                                                onClick={() => setData('club_id', club.id)}
                                                className={`mf-club-opt${selected ? ' is-selected' : ''}`}
                                                aria-pressed={selected}
                                            >
                                                {club.logo_url ? (
                                                    <img
                                                        src={club.logo_url}
                                                        alt=""
                                                        className="mf-avatar h-10 w-10"
                                                    />
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
                                                        {league}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !data.club_id}
                        className="mf-btn mf-btn--pitch mf-auth-submit mt-6"
                    >
                        {processing ? 'Saving…' : 'Continue →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
