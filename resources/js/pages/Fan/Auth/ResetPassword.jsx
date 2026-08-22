import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';

export default function ResetPassword({ email = '', token = '' }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    function submit(e) {
        e.preventDefault();
        post('/reset-password');
    }

    return (
        <div className="mf-stage">
            <div className="mf-onboard">
                <Head title="Choose a new password" />

                <div className="mf-auth-brand">
                    <FanBrandLogo asLink={false} size={28} className="mf-auth-brand-mark" />
                    <span>Mad Fan</span>
                </div>

                <p className="mf-text-caption text-[var(--mf-pitch)]">Account recovery</p>
                <p className="mf-display mf-text-display mt-2 text-[var(--mf-text)]">New password</p>
                <p className="mf-auth-lead">
                    Choose a password with at least 8 characters, mixed case, and a number.
                </p>

                <form onSubmit={submit} className="mf-auth-form">
                    <div className="mf-auth-field">
                        <label className="mf-auth-label" htmlFor="reset-email">
                            Email
                        </label>
                        <input
                            id="reset-email"
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
                        <label className="mf-auth-label" htmlFor="reset-password">
                            New password
                        </label>
                        <div className="mf-auth-input-wrap">
                            <input
                                id="reset-password"
                                type={showPassword ? 'text' : 'password'}
                                className={`mf-auth-input mf-auth-input--password${errors.password ? ' has-error' : ''}`}
                                placeholder="New password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
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
                        {errors.password && <p className="mf-field-error">{errors.password}</p>}
                    </div>

                    <div className="mf-auth-field">
                        <label className="mf-auth-label" htmlFor="reset-password-confirm">
                            Confirm password
                        </label>
                        <input
                            id="reset-password-confirm"
                            type={showPassword ? 'text' : 'password'}
                            className="mf-auth-input"
                            placeholder="Confirm password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <button type="submit" className="mf-btn mf-btn--pitch w-full" disabled={processing}>
                        {processing ? 'Saving…' : 'Save password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
