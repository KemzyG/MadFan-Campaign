import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatNumber } from '@/lib/format';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

function StatCard({ label, value, hint, badge, trend = 'neutral' }) {
    const TrendIcon = trend === 'down' ? TrendingDownIcon : TrendingUpIcon;

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
                {badge ? (
                    <CardAction>
                        <Badge variant="outline">
                            {trend !== 'neutral' ? <TrendIcon /> : null}
                            {badge}
                        </Badge>
                    </CardAction>
                ) : null}
            </CardHeader>
            {hint ? (
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">{hint}</div>
                </CardFooter>
            ) : null}
        </Card>
    );
}

export function OpsDashboardSectionCards({ dashboardMode, stats = {}, staffProfile }) {
    if (dashboardMode === 'personal') {
        return (
            <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                <StatCard
                    label="Performance score"
                    value={formatNumber(stats.performance_score ?? 0)}
                    hint={staffProfile?.position_label ? `${staffProfile.position_label} desk` : 'Your operator score'}
                    badge={stats.staff_rank ? `Rank #${stats.staff_rank}` : null}
                />
                <StatCard
                    label="Lifetime points"
                    value={formatNumber(stats.total_points ?? 0)}
                    hint={`${formatNumber(stats.weekly_claims ?? 0)} claims this week`}
                />
                <StatCard
                    label="Tasks completed"
                    value={formatNumber(stats.completed_tasks ?? stats.staff_completed_tasks ?? 0)}
                    hint={`${formatNumber(stats.pending_tasks ?? stats.staff_pending_tasks ?? 0)} pending · ${formatNumber(stats.failed_tasks ?? 0)} failed`}
                />
                <StatCard
                    label="Referrals & streak"
                    value={formatNumber(stats.total_referrals ?? 0)}
                    hint={`${formatNumber(stats.current_streak_days ?? 0)} day streak · best ${formatNumber(stats.best_streak_days ?? 0)}`}
                    badge={stats.daily_claims_today ? 'Claimed today' : 'No claim yet'}
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @6xl/main:grid-cols-6 dark:*:data-[slot=card]:bg-card">
            <StatCard
                label="Daily active fans"
                value={formatNumber(stats.daily_active_fans_today ?? 0)}
                hint={`${formatNumber(stats.new_users_today ?? 0)} new signups today`}
                badge={`+${formatNumber(stats.new_users_this_week ?? 0)} this week`}
                trend="up"
            />
            <StatCard
                label="Daily posts"
                value={formatNumber(stats.daily_posts_today ?? 0)}
                hint={`${formatNumber(stats.daily_engagement_today ?? 0)} likes & replies today`}
            />
            <StatCard
                label="Daily active live"
                value={formatNumber(stats.daily_active_live_today ?? 0)}
                hint={`${formatNumber(stats.daily_live_participants_today ?? 0)} fans joined live today`}
                badge={stats.daily_active_live_today ? 'Live today' : 'Quiet'}
                trend={stats.daily_active_live_today ? 'up' : 'neutral'}
            />
            <StatCard
                label="Daily events"
                value={formatNumber(stats.daily_events_today ?? 0)}
                hint="Announcements, polls, showdowns & fixtures today"
            />
            <StatCard
                label="Other activities"
                value={formatNumber(stats.daily_other_activities_today ?? 0)}
                hint="Stage chat, votes, reactions & live comments"
            />
            <StatCard
                label="Active events now"
                value={formatNumber(stats.active_events_now ?? 0)}
                hint={`${formatNumber(stats.total_users ?? 0)} total fans on platform`}
                badge={stats.active_events_now ? 'Live now' : 'None live'}
                trend={stats.active_events_now ? 'up' : 'down'}
            />
        </div>
    );
}
