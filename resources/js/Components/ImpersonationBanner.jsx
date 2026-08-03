import { router, usePage } from '@inertiajs/react';

/**
 * Persistent banner while a super-admin is viewing the app as another account.
 */
export default function ImpersonationBanner() {
    const { impersonation } = usePage().props;

    if (!impersonation?.active) {
        return null;
    }

    const asName = impersonation.as?.name ?? 'this account';
    const asEmail = impersonation.as?.email;
    const actorName = impersonation.impersonator?.name ?? 'Super admin';

    function leave() {
        router.post('/impersonation/leave', {}, { preserveScroll: true });
    }

    return (
        <div className="sticky top-0 z-[60] border-b border-amber-500/40 bg-amber-500 text-surface-900">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <p className="font-medium">
                    Viewing as <span className="font-bold">{asName}</span>
                    {asEmail ? <span className="opacity-80"> ({asEmail})</span> : null}
                    <span className="opacity-80">
                        {impersonation.mode === 'soft'
                            ? ' · still signed in as super-admin in the admin console'
                            : ` · signed in as ${actorName}`}
                    </span>
                </p>
                <button
                    type="button"
                    onClick={leave}
                    className="rounded-md bg-surface-900 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-surface-800"
                >
                    Exit view as
                </button>
            </div>
        </div>
    );
}
