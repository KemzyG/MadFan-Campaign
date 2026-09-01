import { Head, useForm } from '@inertiajs/react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';
import ToastStack from '../../../Components/Fan/ToastStack';
import { useToasts } from '../../../lib/useToasts';

export default function PickFandom({ fandoms = [] }) {
    const { data, setData, post, processing } = useForm({
        fandom_id: fandoms.length === 1 ? fandoms[0].id : '',
    });
    const { toasts, dismissToast } = useToasts();

    function submit(e) {
        e.preventDefault();
        post('/social/onboarding/fandom');
    }

    return (
        <div className="mf-auth-stage">
            <Head title="Pick your fandom" />
            <ToastStack toasts={toasts} onDismiss={dismissToast} />

            <div className="mf-onboard-panel">
                <div className="mf-auth-header">
                    <div className="mf-auth-brand">
                        <FanBrandLogo asLink={false} size={30} className="mf-auth-brand-mark" />
                        <span>Mad Fan</span>
                    </div>
                    <h1 className="mf-auth-title">Choose your fandom</h1>
                </div>

                <p className="mf-text-meta text-[var(--mf-muted)]">
                    More fandoms are coming — pick the one you're here for today.
                </p>

                <form onSubmit={submit}>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {fandoms.map((fandom) => {
                            const selected = String(data.fandom_id) === String(fandom.id);

                            return (
                                <button
                                    key={fandom.id}
                                    type="button"
                                    onClick={() => setData('fandom_id', fandom.id)}
                                    className={`mf-club-opt${selected ? ' is-selected' : ''}`}
                                    aria-pressed={selected}
                                >
                                    <span className="mf-avatar h-10 w-10" aria-hidden>
                                        ⚽
                                    </span>
                                    <span className="min-w-0">
                                        <span className="mf-text-ui block truncate font-semibold text-[var(--mf-text)]">
                                            {fandom.name}
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
                        disabled={processing || !data.fandom_id}
                        className="mf-btn mf-btn--pitch mf-auth-submit mt-6"
                    >
                        {processing ? 'Saving…' : 'Continue →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
