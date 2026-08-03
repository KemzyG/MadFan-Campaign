import { Head, useForm, usePage } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { adminPath } from '../../lib/adminPath';

export default function MfaSetup({ otpauth_url: otpauthUrl, secret }) {
    const page = usePage();
    const recoveryCodes = page.props.flash?.mfa_recovery_codes ?? [];
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    function submit(e) {
        e.preventDefault();
        post(adminPath(page.props, 'mfa/setup'));
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface-900 p-4">
            <Head title="Enable MFA" />
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-800/80 p-8 shadow-2xl">
                <h1 className="text-2xl font-semibold text-white">Enable two-factor auth</h1>
                <p className="mt-2 text-sm text-zinc-400">
                    Scan this code with Google Authenticator or Authy, then enter a 6-digit code.
                </p>

                <div className="mt-6 flex justify-center rounded-xl bg-white p-4">
                    <QRCodeSVG value={otpauthUrl} size={180} />
                </div>

                <p className="mt-4 break-all text-center font-mono text-xs text-zinc-300">{secret}</p>

                {recoveryCodes.length > 0 && (
                    <div className="mt-4 rounded-lg border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-zinc-200">
                        <p className="mb-2 font-semibold text-brand-400">Save these recovery codes</p>
                        <ul className="grid grid-cols-2 gap-1 font-mono">
                            {recoveryCodes.map((code) => (
                                <li key={code}>{code}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={submit} className="mt-6 space-y-4">
                    <input
                        className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-white"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                        required
                    />
                    {errors.code && <p className="text-sm text-red-400">{errors.code}</p>}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-surface-900"
                    >
                        {processing ? 'Verifying…' : 'Confirm and continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
