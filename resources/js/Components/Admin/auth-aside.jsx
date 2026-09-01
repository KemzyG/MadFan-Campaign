export function AuthAside() {
    return (
        <div className="relative hidden overflow-hidden bg-muted md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-background to-muted" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(232,255,0,0.18),transparent_45%)]" />
            <div className="relative flex h-full min-h-[28rem] flex-col justify-between p-8 text-foreground">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Mad Fan</p>
                    <h2 className="mt-3 max-w-xs text-3xl font-semibold tracking-tight">Ops console</h2>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        Secure access for staff, moderators, and platform operators.
                    </p>
                </div>
                <p className="text-xs text-muted-foreground">Protected by MFA · Session monitored</p>
            </div>
        </div>
    );
}
