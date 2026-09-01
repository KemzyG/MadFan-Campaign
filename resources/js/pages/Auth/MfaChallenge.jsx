import { Head, useForm, usePage } from '@inertiajs/react';
import { AuthShell } from '@/Components/Admin/auth-shell';
import { Button } from '@/Components/ui/button';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { Spinner } from '@/Components/ui/spinner';
import { adminPath } from '../../lib/adminPath';

export default function MfaChallenge() {
    const page = usePage();
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    function submit(event) {
        event.preventDefault();
        post(adminPath(page.props, 'mfa/challenge'));
    }

    return (
        <>
            <Head title="MFA challenge" />
            <AuthShell>
                <form className="p-6 md:p-8" onSubmit={submit}>
                    <FieldGroup>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-2xl font-bold">Two-factor authentication</h1>
                            <p className="text-balance text-muted-foreground">
                                Enter a code from your authenticator app, or a recovery code.
                            </p>
                        </div>

                        <Field>
                            <FieldLabel htmlFor="code">Authentication code</FieldLabel>
                            <Input
                                id="code"
                                name="code"
                                placeholder="123456 or recovery-code"
                                autoComplete="one-time-code"
                                autoFocus
                                required
                                value={data.code}
                                onChange={(event) => setData('code', event.target.value)}
                                aria-invalid={Boolean(errors.code)}
                            />
                            {errors.code ? (
                                <p className="text-sm text-destructive">{errors.code}</p>
                            ) : null}
                        </Field>

                        <Field>
                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Spinner data-icon="inline-start" />
                                        Verifying…
                                    </>
                                ) : (
                                    'Verify and continue'
                                )}
                            </Button>
                        </Field>

                        <FieldDescription className="text-center">
                            Lost your device? Use a saved recovery code instead.
                        </FieldDescription>
                    </FieldGroup>
                </form>
            </AuthShell>
        </>
    );
}
