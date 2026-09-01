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
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminPath } from '../../../lib/adminPath';

function FieldInput({ field, value, onChange }) {
    if (field.type === 'boolean') {
        const checked = value === true || value === 'true';

        return (
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded border-input"
            />
        );
    }

    if (field.type === 'select') {
        return (
            <NativeSelect className="w-full" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
                {Object.entries(field.options ?? {}).map(([optionValue, optionLabel]) => (
                    <NativeSelectOption key={optionValue || 'none'} value={optionValue}>
                        {optionLabel}
                    </NativeSelectOption>
                ))}
            </NativeSelect>
        );
    }

    return (
        <Input
            type={field.type === 'integer' ? 'number' : field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.type === 'password' ? 'Leave blank to keep current password' : undefined}
        />
    );
}

export default function SettingsIndex({ segments = [] }) {
    const page = usePage();
    const initial = {};

    segments.forEach((segment) => {
        segment.sections?.forEach((section) => {
            section.fields?.forEach((field) => {
                initial[field.key] =
                    field.type === 'boolean'
                        ? field.value === 'true' || field.value === true
                        : field.value ?? '';
            });
        });
    });

    const { data, setData, put, processing, errors } = useForm(initial);
    const [activeSegment, setActiveSegment] = useState(segments[0]?.key ?? 'general');

    function submit(e) {
        e.preventDefault();
        put(adminPath(page.props, 'settings'));
    }

    const currentSegment = segments.find((segment) => segment.key === activeSegment) ?? segments[0];

    return (
        <AdminLayout title="Settings">
            <AdminPageHeader
                title="Application settings"
                description="Configure general options, email delivery, social verification, and system controls."
            />

            <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-wrap gap-2 border-b border-border pb-4">
                    {segments.map((segment) => (
                        <Button
                            key={segment.key}
                            type="button"
                            variant={activeSegment === segment.key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveSegment(segment.key)}
                        >
                            {segment.label}
                        </Button>
                    ))}
                </div>

                {currentSegment?.sections?.map((section) => (
                    <Card key={section.key}>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider">{section.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {section.fields?.map((field) => (
                                    <Field
                                        key={field.key}
                                        
                                        hint={field.description}
                                        error={errors[field.key]}
                                        className={field.type === 'password' ? 'sm:col-span-2' : undefined}
                                    ><FieldLabel>field.label</FieldLabel>
                                        <FieldInput
                                            field={field}
                                            value={data[field.key]}
                                            onChange={(value) => setData(field.key, value)}
                                        />
                                    </Field>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving…' : 'Save settings'}
                </Button>
            </form>
        </AdminLayout>
    );
}
