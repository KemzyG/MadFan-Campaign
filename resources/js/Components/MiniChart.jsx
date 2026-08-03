export default function MiniChart({ labels = [], values = [], color = '#f59e0b', height = 80 }) {
    if (!values.length) {
        return <div className="flex h-20 items-center justify-center text-xs text-zinc-500">No data</div>;
    }

    const max = Math.max(...values, 1);
    const width = 100;
    const step = width / Math.max(values.length - 1, 1);

    const points = values
        .map((v, i) => `${i * step},${height - (v / max) * (height - 8)}`)
        .join(' ');

    return (
        <div>
            <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={`0,${height} ${points} ${width},${height}`}
                    fill="url(#chartFill)"
                />
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
            {labels.length > 0 && (
                <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
                    <span>{labels[0]}</span>
                    <span>{labels[labels.length - 1]}</span>
                </div>
            )}
        </div>
    );
}
