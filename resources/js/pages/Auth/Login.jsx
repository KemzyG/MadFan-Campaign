import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { adminPath } from '../../lib/adminPath';

export default function Login() {
    const page = usePage();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    function submit(e) {
        e.preventDefault();
        post(adminPath(page.props, 'login'));
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface-900 p-4">
            <Head title="Sign in" />
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-800/80 p-8 shadow-2xl backdrop-blur-xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-surface-900">
                        MF
                    </div>
                    <h1 className="text-2xl font-semibold text-white">Admin sign in</h1>
                    <p className="mt-2 text-sm text-zinc-400">Mad Fan loyalty console</p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                            Email
                        </span>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-surface-700 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            placeholder="admin@madfan.com"
                            autoComplete="email"
                            required
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                            Password
                        </span>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-surface-700 px-4 py-3 pr-12 text-sm text-white focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                    </label>

                    <label className="flex items-center gap-2 text-sm text-zinc-400">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-white/20 bg-surface-700 text-brand-500"
                        />
                        Remember me
                    </label>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-surface-900 transition hover:from-brand-400 hover:to-brand-500 disabled:opacity-60"
                    >
                        {processing ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
}
