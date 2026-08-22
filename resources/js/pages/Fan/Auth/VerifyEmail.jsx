import { Head, useForm, usePage } from '@inertiajs/react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';

export default function VerifyEmail({ status }) {
    const { flash } = usePage().props;
    const { post, processing } = useForm({});

    function resend(e) {
        e.preventDefault();
        post('/email/verification-notification');
    }

    function logout(e) {
        e.preventDefault();
        post('/logout');
    }

    return (
        <div className="mf-stage">
            <div className="mf-onboard">
                <Head title="Verify email" />

                <div className="mf-auth-brand">
                    <FanBrandLogo asLink={false} size={28} className="mf-auth-brand-mark" />
                    <span>Mad Fan</span>
                </div>

                <p className="mf-text-caption text-[var(--mf-pitch)]">One more step</p>
                <p className="mf-display mf-text-display mt-2 text-[var(--mf-text)]">Verify your email</p>
                <p className="mf-auth-lead">
                    We sent a verification link to your inbox. Open it to unlock the campaign.
                </p>

                {(status === 'verification-link-sent' || flash?.status === 'verification-link-sent') && (
                    <div className="mf-auth-banner" role="status">
                        A new verification link has been sent.
                    </div>
                )}

                <form onSubmit={resend} className="mf-auth-form">
                    <button type="submit" className="mf-btn mf-btn--pitch w-full" disabled={processing}>
                        {processing ? 'Sending…' : 'Resend verification email'}
                    </button>
                </form>

                <div className="mf-auth-actions">
                    <a href="/logout" className="mf-auth-link" onClick={logout}>
                        Use a different account →
                    </a>
                </div>
            </div>
        </div>
    );
}
