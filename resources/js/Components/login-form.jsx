import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Field,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { Spinner } from '@/Components/ui/spinner';

export function LoginForm({
    className,
    email,
    password,
    remember,
    processing = false,
    errors = {},
    onEmailChange,
    onPasswordChange,
    onRememberChange,
    onSubmit,
    ...props
}) {
    return (
        <form
            className={cn('p-6 md:p-8', className)}
            onSubmit={onSubmit}
            {...props}
        >
            <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-balance text-muted-foreground">
                        Sign in to the Mad Fan ops console
                    </p>
                </div>

                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@madfan.test"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => onEmailChange?.(event.target.value)}
                        aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email ? (
                        <p className="text-sm text-destructive">{errors.email}</p>
                    ) : null}
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => onPasswordChange?.(event.target.value)}
                        aria-invalid={Boolean(errors.password)}
                    />
                    {errors.password ? (
                        <p className="text-sm text-destructive">{errors.password}</p>
                    ) : null}
                </Field>

                <Field orientation="horizontal">
                    <Checkbox
                        id="remember"
                        checked={remember}
                        onCheckedChange={(checked) => onRememberChange?.(Boolean(checked))}
                    />
                    <FieldLabel htmlFor="remember" className="font-normal">
                        Remember me
                    </FieldLabel>
                </Field>

                <Field>
                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing ? (
                            <>
                                <Spinner data-icon="inline-start" />
                                Signing in…
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}
