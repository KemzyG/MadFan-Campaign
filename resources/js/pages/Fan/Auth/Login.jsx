import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';
import PasswordVisibilityToggle from '../../../Components/Fan/PasswordVisibilityToggle';
import ToastStack from '../../../Components/Fan/ToastStack';
import { LockIcon, MailIcon } from '../../../Components/Fan/AuthFieldIcons';
import { useToasts } from '../../../lib/useToasts';

export default function FanLogin() {
    const { flash, errors } = usePage().props;
    const { data, setData, post, processing } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const { toasts, pushToast, dismissToast } = useToasts();

    useEffect(() => {
        if (flash?.error) {
            pushToast('err', flash.error);
        }
    }, [flash?.error, pushToast]);

    useEffect(() => {
        if (flash?.success) {
            pushToast('ok', flash.success);
        }
    }, [flash?.success, pushToast]);

    useEffect(() => {
        Object.values(errors ?? {})
            .filter(Boolean)
            .forEach((message) => pushToast('err', message));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errors]);

    function submit(e) {
        e.preventDefault();
        post('/login');
    }

    return (
        <div className="mf-auth-stage">
            <Head title="Login" />
            <ToastStack toasts={toasts} onDismiss={dismissToast} />

            <div className="mf-onboard-panel">
                <div className="mf-auth-header">
                    <Link href="/" className="mf-auth-brand">
                        <FanBrandLogo asLink={false} size={30} className="mf-auth-brand-mark" />
                        <span>Mad Fan</span>
                    </Link>
                </div>

                <form onSubmit={submit} className="mf-auth-form">
                    <div className="mf-auth-field">
                        <label className="mf-auth-label" htmlFor="login-email">
                            Email
                        </label>
                        <div className="mf-auth-input-wrap">
                            <span className="mf-auth-input-icon">
                                <MailIcon />
                            </span>
                            <input
                                id="login-email"
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
                        <label className="mf-auth-label" htmlFor="login-password">
                            Password
                        </label>
                        <div className="mf-auth-input-wrap">
                            <span className="mf-auth-input-icon">
                                <LockIcon />
                            </span>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className="mf-auth-input mf-auth-input--icon mf-auth-input--password"
                                placeholder="Password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <PasswordVisibilityToggle
                                visible={showPassword}
                                onToggle={() => setShowPassword((current) => !current)}
                            />
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

                    <button
                        type="submit"
                        className="mf-btn mf-btn--pitch mf-auth-submit"
                        disabled={processing}
                    >
                        {processing ? 'Logging in…' : 'Log in'}
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
