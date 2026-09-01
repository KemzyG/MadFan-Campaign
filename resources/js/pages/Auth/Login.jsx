import { Head, useForm, usePage } from '@inertiajs/react';
import { AuthShell } from '@/Components/Admin/auth-shell';
import { LoginForm } from '@/Components/login-form';
import { adminPath } from '../../lib/adminPath';

export default function Login() {
    const page = usePage();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(event) {
        event.preventDefault();
        post(adminPath(page.props, 'login'));
    }

    return (
        <>
            <Head title="Sign in" />
            <AuthShell>
                <LoginForm
                    email={data.email}
                    password={data.password}
                    remember={data.remember}
                    processing={processing}
                    errors={errors}
                    onEmailChange={(value) => setData('email', value)}
                    onPasswordChange={(value) => setData('password', value)}
                    onRememberChange={(value) => setData('remember', value)}
                    onSubmit={submit}
                />
            </AuthShell>
        </>
    );
}
