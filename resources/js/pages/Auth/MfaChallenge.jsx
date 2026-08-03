import { Head, useForm, usePage } from '@inertiajs/react';
import { adminPath } from '../../lib/adminPath';

export default function MfaChallenge() {
    const page = usePage();
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    function submit(e) {
        e.preventDefault();
        post(adminPath(page.props, 'mfa/challenge'));
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface-900 p-4">
            <Head title="MFA challenge" />
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-800/80 p-8 shadow-2xl">
                <h1 className="text-2xl font-semibold text-white">Two-factor authentication</h1>
                <p className="mt-2 text-sm text-zinc-400">
                    Enter a code from your authenticator app, or a recovery code.
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                    <input
                        className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-white"
                        placeholder="123456 or recovery-code"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                        required
                        autoFocus
                    />
                    {errors.code && <p className="text-sm text-red-400">{errors.code}</p>}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-surface-900"
                    >
                        {processing ? 'Checking…' : 'Verify'}
                    </button>
                </form>
            </div>
        </div>
    );
}
