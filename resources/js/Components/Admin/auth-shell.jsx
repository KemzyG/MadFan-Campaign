import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/Components/ui/card';
import { FieldDescription } from '@/Components/ui/field';
import { AuthAside } from '@/Components/Admin/auth-aside';

export function AuthShell({ children, className, showAside = true, footer = null }) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <div className={cn('flex w-full max-w-sm flex-col gap-6 md:max-w-4xl', className)}>
                <Card className="overflow-hidden p-0">
                    <CardContent className="grid p-0 md:grid-cols-2">
                        {children}
                        {showAside ? <AuthAside /> : null}
                    </CardContent>
                </Card>
                {footer ?? (
                    <FieldDescription className="px-6 text-center">
                        Authorized personnel only. Activity is logged.
                    </FieldDescription>
                )}
            </div>
        </div>
    );
}
