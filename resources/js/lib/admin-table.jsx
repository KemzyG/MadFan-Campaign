import { useMemo, useState } from 'react';
import {
    columnFilteringFeature,
    columnVisibilityFeature,
    createColumnHelper,
    createFilteredRowModel,
    createSortedRowModel,
    FlexRender,
    rowSelectionFeature,
    rowSortingFeature,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { ChevronDownIcon, Columns3Icon, SearchIcon } from 'lucide-react';

const features = tableFeatures({
    columnFilteringFeature,
    columnVisibilityFeature,
    rowSelectionFeature,
    rowSortingFeature,
    filteredRowModel: createFilteredRowModel(),
    sortedRowModel: createSortedRowModel(),
});

const columnHelper = createColumnHelper();

function cellText(value) {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    return '';
}

function globalFilterFn(row, _columnId, filterValue) {
    const query = String(filterValue ?? '').trim().toLowerCase();

    if (query === '') {
        return true;
    }

    return Object.entries(row.original).some(([key, value]) => {
        if (key === 'actions') {
            return false;
        }

        return cellText(value).toLowerCase().includes(query);
    });
}

/**
 * shadcn dashboard-01 style data table for ops CRUD pages.
 * Server pagination stays on AdminPagination — this filters/sorts/selects the current page.
 */
export function AdminTable({
    columns,
    rows,
    emptyMessage = 'No records found.',
    searchPlaceholder = 'Search rows…',
    enableSelection = true,
}) {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const tableColumns = useMemo(() => {
        const mapped = columns.map((col) =>
            columnHelper.accessor((row) => row[col.key], {
                id: col.key,
                header: ({ column }) => {
                    if (!col.label || col.key === 'actions') {
                        return col.label ?? '';
                    }

                    return (
                        <Button
                            type="button"
                            variant="ghost"
                            className="-ml-3 h-8 px-2 text-xs font-medium"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {col.label}
                            {column.getIsSorted() === 'asc' ? ' ↑' : null}
                            {column.getIsSorted() === 'desc' ? ' ↓' : null}
                        </Button>
                    );
                },
                cell: ({ row }) => (col.render ? col.render(row.original) : row.original[col.key]),
                enableSorting: Boolean(col.label) && col.key !== 'actions',
                enableHiding: Boolean(col.label) && col.key !== 'actions',
            }),
        );

        if (!enableSelection) {
            return mapped;
        }

        return [
            columnHelper.display({
                id: 'select',
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected()}
                            indeterminate={
                                table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
                            }
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            }),
            ...mapped,
        ];
    }, [columns, enableSelection]);

    const table = useTable({
        features,
        data: rows,
        columns: tableColumns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        enableRowSelection: enableSelection,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getRowId: (row, index) => String(row.id ?? index),
    });

    const selectedCount = table.getFilteredSelectedRowModel().rows.length;
    const visibleCount = table.getFilteredRowModel().rows.length;

    return (
        <Card>
            <CardContent className="flex flex-col gap-4 p-0">
                <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={globalFilter}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="pl-8"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {enableSelection && selectedCount > 0 ? (
                            <Badge variant="secondary">{selectedCount} selected</Badge>
                        ) : null}
                        <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                                <Columns3Icon data-icon="inline-start" />
                                Columns
                                <ChevronDownIcon data-icon="inline-end" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {columns.find((col) => col.key === column.id)?.label ?? column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="overflow-hidden px-4 pb-4">
                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} colSpan={header.colSpan}>
                                                {header.isPlaceholder ? null : (
                                                    <FlexRender header={header} />
                                                )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    <FlexRender cell={cell} />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={tableColumns.length}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            {emptyMessage}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {enableSelection ? (
                    <div className="border-t px-4 py-2 text-sm text-muted-foreground">
                        {selectedCount} of {visibleCount} row(s) selected on this page.
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
