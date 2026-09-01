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
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import AdminLayout from '../../../Layouts/AdminLayout';
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
            <AdminPageHeader
                title="System logs"
                description={`Tail of laravel.log · ${logData?.size ? `${Math.round(logData.size / 1024)} KB` : 'empty'}`}
                actions={
                    <>
                        <Button type="button" variant="outline" onClick={refresh}>
                            Refresh
                        </Button>
                        <Button type="button" variant="outline" className="text-destructive" onClick={clearLogs}>
                            Clear log
                        </Button>
                    </>
                }
            />

            <Card>
                <CardContent className="max-h-[70vh] overflow-auto p-4 font-mono text-xs">
                    {(logData?.lines ?? []).length === 0 ? (
                        <p className="text-muted-foreground">No log entries found.</p>
                    ) : (
                        logData.lines.map((line, index) => (
                            <div key={index} className="mb-3 border-b border-border pb-3 last:border-0">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="text-muted-foreground">{line.timestamp}</span>
                                    <Badge variant={adminBadgeVariant(levelVariant[line.level] ?? 'default')} className={adminBadgeClass(levelVariant[line.level] ?? 'default')}>{line.level}</Badge>
                                </div>
                                <p className="whitespace-pre-wrap">{line.message}</p>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
