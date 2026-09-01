import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Field, FieldLabel } from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/Components/ui/native-select';

export function AdminFilterBar({ fields, filters, route }) {
    const [values, setValues] = useState(filters ?? {});

    function submit(e) {
        e.preventDefault();
        router.get(route, values, { preserveState: true, replace: true });
    }

    function reset() {
        setValues({});
        router.get(route, {}, { preserveState: true, replace: true });
    }

    return (
        <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3">
            {fields.map((field) => (
                <Field key={field.name} className="min-w-40">
                    <FieldLabel>{field.label}</FieldLabel>
                    {field.type === 'select' ? (
                        <NativeSelect
                            className="w-full"
                            value={values[field.name] ?? ''}
                            onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        >
                            <NativeSelectOption value="">All</NativeSelectOption>
                            {field.options?.map((opt) => (
                                <NativeSelectOption key={opt.value ?? opt} value={opt.value ?? opt}>
                                    {opt.label ?? opt}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    ) : (
                        <Input
                            type={field.type ?? 'text'}
                            value={values[field.name] ?? ''}
                            onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                            placeholder={field.placeholder}
                        />
                    )}
                </Field>
            ))}
            <Button type="submit">Filter</Button>
            <Button type="button" variant="outline" onClick={reset}>
                Reset
            </Button>
        </form>
    );
}
