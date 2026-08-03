import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import PageHeader from '../../../Components/PageHeader';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';

const levelVariant = {
    emergency: 'danger',
    alert: 'danger',
    critical: 'danger',
    error: 'danger',
    warning: 'warning',
    notice: 'brand',
    info: 'default',
    debug: 'default',
};

export default function SystemLogsIndex({ logData, lines }) {
    const page = usePage();

    async function clearLogs() {
        if (!confirm('Clear the Laravel log file?')) return;
        await adminApi('/system-logs', { method: 'DELETE' });
        router.reload({ only: ['logData'] });
    }

    function refresh() {
        router.get(adminPath(page.props, 'system-logs'), { lines }, { preserveState: true });
    }

    return (
        <AdminLayout title="System Logs">
            <PageHeader
                title="System logs"
                description={`Tail of laravel.log · ${logData?.size ? `${Math.round(logData.size / 1024)} KB` : 'empty'}`}
                actions={
                    <>
                        <button onClick={refresh} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">
                            Refresh
                        </button>
                        <button onClick={clearLogs} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10">
                            Clear log
                        </button>
                    </>
                }
            />

            <div className="rounded-2xl border border-white/5 bg-surface-800/50">
                <div className="max-h-[70vh] overflow-auto p-4 font-mono text-xs">
                    {(logData?.lines ?? []).length === 0 ? (
                        <p className="text-zinc-500">No log entries found.</p>
                    ) : (
                        logData.lines.map((line, index) => (
                            <div key={index} className="mb-3 border-b border-white/5 pb-3 last:border-0">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="text-zinc-500">{line.timestamp}</span>
                                    <Badge variant={levelVariant[line.level] ?? 'default'}>{line.level}</Badge>
                                </div>
                                <p className="whitespace-pre-wrap text-zinc-300">{line.message}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
