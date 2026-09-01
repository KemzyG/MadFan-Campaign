import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/Components/ui/chart';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/Components/ui/toggle-group';

const chartConfig = {
    value: {
        label: 'Total',
        color: 'var(--primary)',
    },
};

function normalizeTrend(rows, valueKey) {
    return (rows ?? []).map((row) => ({
        date: row.date ?? row.series_date,
        value: Number(row[valueKey] ?? row.total ?? row.count ?? 0),
    }));
}

function normalizeSeries(series) {
    const labels = series?.labels ?? [];
    const values = series?.values ?? [];

    return labels.map((label, index) => ({
        date: label,
        value: Number(values[index] ?? 0),
    }));
}

function formatTick(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const platformMetrics = [
    { key: 'signups', label: 'Signups' },
    { key: 'active_fans', label: 'Active fans' },
    { key: 'posts', label: 'Posts' },
    { key: 'engagement', label: 'Engagement' },
    { key: 'live', label: 'Live' },
    { key: 'events', label: 'Events' },
    { key: 'activities', label: 'Activities' },
    { key: 'points', label: 'Points' },
];

export function OpsDashboardChart({
    dashboardMode,
    signupTrend = [],
    pointsSeries = { labels: [], values: [] },
    activeFansSeries = { labels: [], values: [] },
    postsSeries = { labels: [], values: [] },
    engagementSeries = { labels: [], values: [] },
    liveSeries = { labels: [], values: [] },
    eventsSeries = { labels: [], values: [] },
    activitiesSeries = { labels: [], values: [] },
    activityTimeline = [],
}) {
    const [metric, setMetric] = useState(dashboardMode === 'personal' ? 'activity' : 'signups');

    const datasets = useMemo(() => {
        if (dashboardMode === 'personal') {
            const buckets = new Map();

            for (const item of activityTimeline ?? []) {
                if (!item.occurred_at) {
                    continue;
                }

                const day = item.occurred_at.slice(0, 10);
                buckets.set(day, (buckets.get(day) ?? 0) + 1);
            }

            const activity = [...buckets.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-14)
                .map(([date, value]) => ({ date, value }));

            return {
                activity: { label: 'Activity', data: activity },
            };
        }

        return {
            signups: { label: 'New signups', data: normalizeTrend(signupTrend, 'count') },
            active_fans: { label: 'Daily active fans', data: normalizeSeries(activeFansSeries) },
            posts: { label: 'Daily posts', data: normalizeSeries(postsSeries) },
            engagement: { label: 'Daily engagement', data: normalizeSeries(engagementSeries) },
            live: { label: 'Daily live sessions', data: normalizeSeries(liveSeries) },
            events: { label: 'Daily events', data: normalizeSeries(eventsSeries) },
            activities: { label: 'Other activities', data: normalizeSeries(activitiesSeries) },
            points: { label: 'Points awarded', data: normalizeSeries(pointsSeries) },
        };
    }, [activeFansSeries, activitiesSeries, activityTimeline, dashboardMode, engagementSeries, eventsSeries, liveSeries, pointsSeries, postsSeries, signupTrend]);

    const metricKeys = Object.keys(datasets);
    const activeMetric = datasets[metric] ? metric : metricKeys[0];
    const active = datasets[activeMetric] ?? { label: 'Activity', data: [] };

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardTitle>{dashboardMode === 'personal' ? 'Your activity' : 'Platform analytics'}</CardTitle>
                <CardDescription>
                    {dashboardMode === 'personal'
                        ? 'Recent task and assignment events over time'
                        : 'Daily active fans, posts, engagement, and growth trends'}
                </CardDescription>
                {dashboardMode !== 'personal' ? (
                    <CardAction>
                        <ToggleGroup
                            multiple={false}
                            value={activeMetric ? [activeMetric] : []}
                            onValueChange={(value) => setMetric(value[0] ?? 'signups')}
                            variant="outline"
                            className="hidden *:data-[slot=toggle-group-item]:px-3! @[900px]/card:flex"
                        >
                            {platformMetrics.map(({ key, label }) => (
                                <ToggleGroupItem key={key} value={key}>
                                    {label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                        <Select value={activeMetric} onValueChange={setMetric}>
                            <SelectTrigger className="w-44 @[900px]/card:hidden" size="sm">
                                <SelectValue placeholder="Metric" />
                            </SelectTrigger>
                            <SelectContent>
                                {platformMetrics.map(({ key, label }) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
                    <AreaChart data={active.data}>
                        <defs>
                            <linearGradient id="opsFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.08} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={24}
                            tickFormatter={formatTick}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={formatTick}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            dataKey="value"
                            name={active.label}
                            type="natural"
                            fill="url(#opsFill)"
                            stroke="var(--color-value)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
