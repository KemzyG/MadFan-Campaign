import { Head, useForm, usePage } from '@inertiajs/react';
import FanLayout from '../../../Layouts/FanLayout';

export default function FanLogin() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e) {
        e.preventDefault();
        post('/login');
    }

    return (
        <FanLayout withSidebar={false}>
            <Head title="Enter Campaign" />
            <div className="wrap">
                <div className="signup-block" style={{ marginTop: '48px' }}>
                    <h2>ENTER CAMPAIGN</h2>
                    <p>Access your daily claim, tasks, and fan passport.</p>
                    {flash?.error && (
                        <div className="reg-error-banner" role="alert" style={{ marginBottom: '16px' }}>
                            {flash.error}
                        </div>
                    )}
                    {flash?.success && (
                        <div className="reg-error-banner" role="status" style={{ marginBottom: '16px' }}>
                            {flash.success}
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
                            <input
                                type="password"
                                placeholder="Password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            {errors.email && (
                                <p style={{ color: 'var(--ember)', fontSize: '13px', textAlign: 'left' }}>{errors.email}</p>
                            )}
                            <button type="submit" className="btn-join" disabled={processing}>
                                {processing ? 'ENTERING…' : 'ENTER CAMPAIGN'}
                            </button>
                        </div>
                    </form>
                    <p style={{ marginTop: '16px' }}>
                        <a href="/forgot-password" style={{ color: 'var(--flame)', fontSize: '13px', marginRight: '16px' }}>
                            Forgot password?
                        </a>
                        <a href="/register" style={{ color: 'var(--flame)', fontSize: '13px' }}>
                            Create an account →
                        </a>
                    </p>
                </div>
            </div>
        </FanLayout>
    );
}
