import { adminBadgeClass, adminBadgeVariant } from '@/lib/admin-badge';
import { AdminFilterBar } from '@/lib/admin-filter-bar';
import { AdminPageHeader } from '@/lib/admin-page-header';
import { AdminPagination } from '@/lib/admin-pagination';
import { AdminTable } from '@/lib/admin-table';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Field, FieldLabel } from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/Components/ui/native-select';
import { Textarea } from '@/Components/ui/textarea';
import { useForm, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import AdminLayout from '../../../Layouts/AdminLayout';
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
            <AdminPageHeader
                title="Your admin profile"
                description="Update identity for this operator account. Role and permissions are managed by super-admins."
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-4">
                            {recentlySuccessful && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile saved.</p>
                            )}

                            <Field  error={errors.name}><FieldLabel>Name</FieldLabel>
                                <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            </Field>
                            <Field  error={errors.email}><FieldLabel>Email</FieldLabel>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </Field>

                            <div className="border-t border-border pt-4">
                                <h3 className="mb-3 text-sm font-semibold">Change password</h3>
                                <div className="space-y-3">
                                    <Field  error={errors.current_password}><FieldLabel>Current password</FieldLabel>
                                        <Input
                                            type="password"
                                            value={data.current_password}
                                            onChange={(e) => setData('current_password', e.target.value)}
                                            autoComplete="current-password"
                                        />
                                    </Field>
                                    <Field  error={errors.password}><FieldLabel>New password</FieldLabel>
                                        <Input
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            autoComplete="new-password"
                                        />
                                    </Field>
                                    <Field  error={errors.password_confirmation}><FieldLabel>Confirm new password</FieldLabel>
                                        <Input
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            autoComplete="new-password"
                                        />
                                    </Field>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving…' : 'Save profile'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <aside className={`rounded-xl border p-5 ${accent.soft}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>
                        {workspace?.label}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{workspace?.job}</p>
                    <div className="mt-4">
                        <p className="text-xs text-muted-foreground">Roles</p>
                        <ul className="mt-1 space-y-1 text-sm">
                            {(profile?.roles ?? []).map((role) => (
                                <li key={role}>{role}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-muted-foreground">Permissions ({profile?.permissions?.length ?? 0})</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            Nav and actions follow your Spatie permissions for this desk.
                        </p>
                    </div>
                </aside>
            </div>
        </AdminLayout>
    );
}
