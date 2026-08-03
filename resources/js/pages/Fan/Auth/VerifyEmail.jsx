import { Head, useForm, usePage } from '@inertiajs/react';
import FanLayout from '../../../Layouts/FanLayout';

export default function VerifyEmail({ status }) {
    const { flash } = usePage().props;
    const { post, processing } = useForm({});

    function resend(e) {
        e.preventDefault();
        post('/email/verification-notification');
    }

    return (
        <FanLayout withSidebar={false}>
            <Head title="Verify email" />
            <div className="wrap">
                <div className="signup-block" style={{ marginTop: '48px' }}>
                    <h2>VERIFY YOUR EMAIL</h2>
                    <p>We sent a verification link to your inbox. Open it to unlock the campaign.</p>
                    {(status === 'verification-link-sent' || flash?.status === 'verification-link-sent') && (
                        <div className="reg-error-banner" role="status" style={{ marginBottom: '16px' }}>
                            A new verification link has been sent.
                        </div>
                    )}
                    <form onSubmit={resend}>
                        <button type="submit" className="btn-join" disabled={processing}>
                            {processing ? 'SENDING…' : 'RESEND VERIFICATION EMAIL'}
                        </button>
                    </form>
                    <p style={{ marginTop: '16px' }}>
                        <a href="/logout" style={{ color: 'var(--flame)', fontSize: '13px' }}
                            onClick={(e) => {
                                e.preventDefault();
                                post('/logout');
                            }}
                        >
                            Use a different account →
                        </a>
                    </p>
                </div>
            </div>
        </FanLayout>
    );
}
