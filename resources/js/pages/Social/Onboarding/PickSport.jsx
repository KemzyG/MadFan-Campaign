import { Head, useForm } from '@inertiajs/react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';
import ToastStack from '../../../Components/Fan/ToastStack';
import { useToasts } from '../../../lib/useToasts';
import OnboardStepper from './OnboardStepper';

export default function PickSport({ sports = [] }) {
    const { data, setData, post, processing } = useForm({
        sport_id: sports.length === 1 ? sports[0].id : '',
    });
    const { toasts, dismissToast } = useToasts();

    function submit(e) {
        e.preventDefault();
        post('/social/onboarding/sport');
    }

    return (
        <div className="mf-auth-stage">
            <Head title="Pick your sport" />
            <ToastStack toasts={toasts} onDismiss={dismissToast} />

            <div className="mf-onboard-panel">
                <div className="mf-auth-header">
                    <div className="mf-auth-brand">
                        <FanBrandLogo asLink={false} size={30} className="mf-auth-brand-mark" />
                        <span>Mad Fan</span>
                    </div>
                    <h1 className="mf-auth-title">Choose your sport</h1>
                </div>

                <OnboardStepper currentStep={1} />

                <p className="mf-text-meta text-[var(--mf-muted)]">
                    More sports are coming — this is the one your club lives in today.
                </p>

                <form onSubmit={submit}>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {sports.map((sport) => {
                            const selected = String(data.sport_id) === String(sport.id);

                            return (
                                <button
                                    key={sport.id}
                                    type="button"
                                    onClick={() => setData('sport_id', sport.id)}
                                    className={`mf-club-opt${selected ? ' is-selected' : ''}`}
                                    aria-pressed={selected}
                                >
                                    <span className="mf-avatar h-10 w-10" aria-hidden>
                                        ⚽
                                    </span>
                                    <span className="min-w-0">
                                        <span className="mf-text-ui block truncate font-semibold text-[var(--mf-text)]">
                                            {sport.name}
                                        </span>
                                        <span className="mf-text-meta block truncate text-[var(--mf-muted)]">
                                            Available now
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !data.sport_id}
                        className="mf-btn mf-btn--pitch mf-auth-submit mt-6"
                    >
                        {processing ? 'Saving…' : 'Continue →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
