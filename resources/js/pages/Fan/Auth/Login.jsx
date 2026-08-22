import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';

export default function FanLogin() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    function submit(e) {
        e.preventDefault();
        post('/login');
    }

    return (
        <div className="mf-stage">
            <div className="mf-onboard">
                <Head title="Enter Campaign" />

                <Link href="/" className="mf-auth-brand">
                    <FanBrandLogo asLink={false} size={28} className="mf-auth-brand-mark" />
                    <span>Mad Fan</span>
                </Link>

                <p className="mf-text-caption text-[var(--mf-pitch)]">Welcome back</p>
                <p className="mf-display mf-text-display mt-2 text-[var(--mf-text)]">Enter the campaign</p>
                <p className="mf-auth-lead">Access your daily claim, tasks, and fan passport.</p>

                {flash?.error && (
                    <div className="mf-auth-banner mf-auth-banner--error" role="alert">
                        {flash.error}
                    </div>
                )}
                {flash?.success && (
                    <div className="mf-auth-banner" role="status">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="mf-auth-form">
                    <div className="mf-auth-field">
                        <label className="mf-auth-label" htmlFor="login-email">
                            Email
                        </label>
                        <input
                            id="login-email"
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

                    <div className="mf-auth-field">
                        <label className="mf-auth-label" htmlFor="login-password">
                            Password
                        </label>
                        <div className="mf-auth-input-wrap">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className="mf-auth-input mf-auth-input--password"
                                placeholder="Password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className="mf-auth-toggle"
                                onClick={() => setShowPassword((current) => !current)}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <label className="mf-auth-checkbox">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        Remember me
                    </label>

                    <button type="submit" className="mf-btn mf-btn--pitch w-full" disabled={processing}>
                        {processing ? 'Entering…' : 'Enter campaign'}
                    </button>
                </form>

                <div className="mf-auth-actions">
                    <Link href="/forgot-password" className="mf-auth-link">
                        Forgot password?
                    </Link>
                    <Link href="/register" className="mf-auth-link">
                        Create an account →
                    </Link>
                </div>
            </div>
        </div>
    );
}
