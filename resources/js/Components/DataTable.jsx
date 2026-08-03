export default function DataTable({
    columns,
    rows,
    emptyMessage = 'No records found.',
    renderCell,
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-800/50">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-12 text-center text-sm text-zinc-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, index) => (
                                <tr
                                    key={row.id ?? index}
                                    className="border-b border-white/5 transition hover:bg-white/[0.02]"
                                >
                                    {columns.map((col) => {
                                        let content;

                                        if (typeof renderCell === 'function') {
                                            const custom = renderCell(row, col);
                                            if (custom !== undefined) {
                                                content = custom;
                                            }
                                        }

                                        if (content === undefined) {
                                            content = col.render ? col.render(row) : row[col.key];
                                        }

                                        return (
                                            <td key={col.key} className="px-4 py-3 text-zinc-300">
                                                {content}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
