import { Head, Link, useForm, usePage } from '@inertiajs/react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';

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
        <div className="mf-stage">
            <div className="mf-onboard">
                <Head title="Forgot password" />

                <Link href="/" className="mf-auth-brand">
                    <FanBrandLogo asLink={false} size={28} className="mf-auth-brand-mark" />
                    <span>Mad Fan</span>
                </Link>

                <p className="mf-text-caption text-[var(--mf-pitch)]">Account recovery</p>
                <p className="mf-display mf-text-display mt-2 text-[var(--mf-text)]">Reset your password</p>
                <p className="mf-auth-lead">
                    Enter your email and we&apos;ll send reset instructions if an account exists.
                </p>

                {(flash?.status || flash?.success) && (
                    <div className="mf-auth-banner" role="status">
                        {flash.status || flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="mf-auth-form">
                    <div className="mf-auth-field">
                        <label className="mf-auth-label" htmlFor="forgot-email">
                            Email
                        </label>
                        <input
                            id="forgot-email"
                            type="email"
                            className={`mf-auth-input${errors.email ? ' has-error' : ''}`}
                            placeholder="your@email.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="email"
                            required
                        />
                        {errors.email && <p className="mf-field-error">{errors.email}</p>}
                    </div>

                    <button type="submit" className="mf-btn mf-btn--pitch w-full" disabled={processing}>
                        {processing ? 'Sending…' : 'Send reset link'}
                    </button>
                </form>

                <div className="mf-auth-actions">
                    <Link href="/login" className="mf-auth-link">
                        Back to enter campaign →
                    </Link>
                </div>
            </div>
        </div>
    );
}
