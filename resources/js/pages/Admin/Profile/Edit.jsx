import { useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { FormField, FormInput } from '../../../Components/Admin/FormField';
import PageHeader from '../../../Components/PageHeader';
import { adminPath } from '../../../lib/adminPath';
import { WORKSPACE_ACCENTS } from '../../../admin/roleWorkspaces';

export default function ProfileEdit({ profile, workspace }) {
    const page = usePage();
    const accent = WORKSPACE_ACCENTS[workspace?.accent] ?? WORKSPACE_ACCENTS.brand;
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name: profile?.name ?? '',
        email: profile?.email ?? '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        put(adminPath(page.props, 'profile'), {
            preserveScroll: true,
            onSuccess: () => {
                setData('current_password', '');
                setData('password', '');
                setData('password_confirmation', '');
            },
        });
    }

    return (
        <AdminLayout title="Profile">
            <PageHeader
                title="Your admin profile"
                description="Update identity for this operator account. Role and permissions are managed by super-admins."
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <form
                    onSubmit={submit}
                    className="space-y-4 rounded-2xl border border-white/10 bg-surface-800/50 p-6"
                >
                    {recentlySuccessful && (
                        <p className="text-sm text-emerald-400">Profile saved.</p>
                    )}

                    <FormField label="Name" error={errors.name}>
                        <FormInput value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    </FormField>
                    <FormField label="Email" error={errors.email}>
                        <FormInput
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                    </FormField>

                    <div className="border-t border-white/5 pt-4">
                        <h3 className="mb-3 text-sm font-semibold text-white">Change password</h3>
                        <div className="space-y-3">
                            <FormField label="Current password" error={errors.current_password}>
                                <FormInput
                                    type="password"
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    autoComplete="current-password"
                                />
                            </FormField>
                            <FormField label="New password" error={errors.password}>
                                <FormInput
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    autoComplete="new-password"
                                />
                            </FormField>
                            <FormField label="Confirm new password" error={errors.password_confirmation}>
                                <FormInput
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    autoComplete="new-password"
                                />
                            </FormField>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900 disabled:opacity-60"
                        >
                            {processing ? 'Saving…' : 'Save profile'}
                        </button>
                    </div>
                </form>

                <aside className={`rounded-2xl border border-white/10 p-5 ${accent.soft}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>
                        {workspace?.label}
                    </p>
                    <p className="mt-2 text-sm text-zinc-300">{workspace?.job}</p>
                    <div className="mt-4">
                        <p className="text-xs text-zinc-500">Roles</p>
                        <ul className="mt-1 space-y-1 text-sm text-zinc-200">
                            {(profile?.roles ?? []).map((role) => (
                                <li key={role}>{role}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-zinc-500">Permissions ({profile?.permissions?.length ?? 0})</p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                            Nav and actions follow your Spatie permissions for this desk.
                        </p>
                    </div>
                </aside>
            </div>
        </AdminLayout>
    );
}
