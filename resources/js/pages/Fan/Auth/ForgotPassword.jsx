import { Head, useForm, usePage } from '@inertiajs/react';
import FanLayout from '../../../Layouts/FanLayout';

export default function ForgotPassword() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/forgot-password');
    }

    return (
        <FanLayout withSidebar={false}>
            <Head title="Forgot password" />
            <div className="wrap">
                <div className="signup-block" style={{ marginTop: '48px' }}>
                    <h2>RESET PASSWORD</h2>
                    <p>Enter your email and we will send reset instructions if an account exists.</p>
                    {(flash?.status || flash?.success) && (
                        <div className="reg-error-banner" role="status" style={{ marginBottom: '16px' }}>
                            {flash.status || flash.success}
                        </div>
                    )}
                    <form onSubmit={submit}>
                        <div className="input-row" style={{ flexDirection: 'column', maxWidth: '100%' }}>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && (
                                <p style={{ color: 'var(--ember)', fontSize: '13px', textAlign: 'left' }}>{errors.email}</p>
                            )}
                            <button type="submit" className="btn-join" disabled={processing}>
                                {processing ? 'SENDING…' : 'SEND RESET LINK'}
                            </button>
                        </div>
                    </form>
                    <p style={{ marginTop: '16px' }}>
                        <a href="/login" style={{ color: 'var(--flame)', fontSize: '13px' }}>
                            Back to enter campaign →
                        </a>
                    </p>
                </div>
            </div>
        </FanLayout>
    );
}
