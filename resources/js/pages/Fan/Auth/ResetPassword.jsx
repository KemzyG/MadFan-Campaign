import { Head, useForm } from '@inertiajs/react';
import FanLayout from '../../../Layouts/FanLayout';

export default function ResetPassword({ email = '', token = '' }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/reset-password');
    }

    return (
        <FanLayout withSidebar={false}>
            <Head title="Choose a new password" />
            <div className="wrap">
                <div className="signup-block" style={{ marginTop: '48px' }}>
                    <h2>NEW PASSWORD</h2>
                    <p>Choose a password with at least 8 characters, mixed case, and a number.</p>
                    <form onSubmit={submit}>
                        <div className="input-row" style={{ flexDirection: 'column', maxWidth: '100%' }}>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="New password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Confirm password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                            />
                            {(errors.email || errors.password) && (
                                <p style={{ color: 'var(--ember)', fontSize: '13px', textAlign: 'left' }}>
                                    {errors.email || errors.password}
                                </p>
                            )}
                            <button type="submit" className="btn-join" disabled={processing}>
                                {processing ? 'SAVING…' : 'SAVE PASSWORD'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </FanLayout>
    );
}
