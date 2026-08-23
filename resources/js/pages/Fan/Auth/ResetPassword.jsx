import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';
import PasswordVisibilityToggle from '../../../Components/Fan/PasswordVisibilityToggle';
import ToastStack from '../../../Components/Fan/ToastStack';
import { LockIcon, MailIcon } from '../../../Components/Fan/AuthFieldIcons';
import { useToasts } from '../../../lib/useToasts';

export default function ResetPassword({ email = '', token = '' }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const { toasts, pushToast, dismissToast } = useToasts();

    useEffect(() => {
        Object.values(errors ?? {})
            .filter(Boolean)
            .forEach((message) => pushToast('err', message));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errors]);

    function submit(e) {
        e.preventDefault();
        post('/reset-password');
    }

    return (
        <div className="mf-auth-stage">
            <Head title="Reset password" />
            <ToastStack toasts={toasts} onDismiss={dismissToast} />

            <div className="mf-onboard-panel">
                <div className="mf-auth-header">
                    <div className="mf-auth-brand">
                        <FanBrandLogo asLink={false} size={30} className="mf-auth-brand-mark" />
                        <span>Mad Fan</span>
                    </div>
                </div>

                <form onSubmit={submit} className="mf-auth-form">
                    <div className="mf-auth-field">
                        <label className="mf-auth-label" htmlFor="reset-email">
                            Email
                        </label>
                        <div className="mf-auth-input-wrap">
                            <span className="mf-auth-input-icon">
                                <MailIcon />
                            </span>
                            <input
                                id="reset-email"
                                type="email"
                                className={`mf-auth-input mf-auth-input--icon${errors.email ? ' has-error' : ''}`}
                                placeholder="your@email.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>

                    <div className="mf-auth-field">
                        <label className="mf-auth-label" htmlFor="reset-password">
                            New password
                        </label>
                        <div className="mf-auth-input-wrap">
                            <span className="mf-auth-input-icon">
                                <LockIcon />
                            </span>
                            <input
                                id="reset-password"
                                type={showPassword ? 'text' : 'password'}
                                className={`mf-auth-input mf-auth-input--icon mf-auth-input--password${errors.password ? ' has-error' : ''}`}
                                placeholder="New password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            <PasswordVisibilityToggle
                                visible={showPassword}
                                onToggle={() => setShowPassword((current) => !current)}
                            />
                        </div>
                    </div>

                    <div className="mf-auth-field">
                        <label className="mf-auth-label" htmlFor="reset-password-confirm">
                            Confirm password
                        </label>
                        <div className="mf-auth-input-wrap">
                            <span className="mf-auth-input-icon">
                                <LockIcon />
                            </span>
                            <input
                                id="reset-password-confirm"
                                type={showPassword ? 'text' : 'password'}
                                className="mf-auth-input mf-auth-input--icon"
                                placeholder="Confirm password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="mf-btn mf-btn--pitch mf-auth-submit" disabled={processing}>
                        {processing ? 'Saving…' : 'Save password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
