import { Head, useForm, usePage } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
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

export default function MfaSetup({ otpauth_url: otpauthUrl, secret }) {
    const page = usePage();
    const recoveryCodes = page.props.flash?.mfa_recovery_codes ?? [];
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    function submit(event) {
        event.preventDefault();
        post(adminPath(page.props, 'mfa/setup'));
    }

    return (
        <>
            <Head title="Enable MFA" />
            <AuthShell>
                <form className="p-6 md:p-8" onSubmit={submit}>
                    <FieldGroup>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-2xl font-bold">Enable two-factor auth</h1>
                            <p className="text-balance text-muted-foreground">
                                Scan the code with Google Authenticator or Authy, then confirm with a 6-digit code.
                            </p>
                        </div>

                        <div className="flex justify-center rounded-xl border bg-background p-4">
                            <QRCodeSVG value={otpauthUrl} size={180} />
                        </div>

                        <FieldDescription className="break-all text-center font-mono text-xs">
                            {secret}
                        </FieldDescription>

                        {recoveryCodes.length > 0 ? (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
                                <p className="mb-2 font-semibold text-primary">Save these recovery codes</p>
                                <ul className="grid grid-cols-2 gap-1 font-mono">
                                    {recoveryCodes.map((code) => (
                                        <li key={code}>{code}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        <Field>
                            <FieldLabel htmlFor="code">6-digit code</FieldLabel>
                            <Input
                                id="code"
                                name="code"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="123456"
                                autoComplete="one-time-code"
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
                                    'Confirm and continue'
                                )}
                            </Button>
                        </Field>
                    </FieldGroup>
                </form>
            </AuthShell>
        </>
    );
}
