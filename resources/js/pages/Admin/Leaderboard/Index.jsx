import { AdminPageHeader } from '@/lib/admin-page-header';
import { AdminTable } from '@/lib/admin-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminPath } from '../../../lib/adminPath';
import { formatNumber } from '../../../lib/format';

function scopeLabel(scope, fandom, club, league) {
    if (scope === 'fandom' && fandom) {
        return fandom.name;
    }

    if (scope === 'club' && club) {
        return club.name;
    }

    if (scope === 'league' && league) {
        return league.name;
    }

    return 'Global';
}

export default function LeaderboardIndex({
    scope = 'global',
    board = { entries: [], total_fans: 0, limit: 50 },
    filters = {},
    scope_options: scopeOptions = [],
    fandom = null,
    club = null,
    league = null,
    fandoms = [],
    clubs = [],
    leagues = [],
}) {
    const page = usePage();
    const base = adminPath(page.props);
    const route = `${base}/leaderboard`;

    const [values, setValues] = useState({
        scope: filters.scope ?? scope ?? 'global',
        fandom_id: filters.fandom_id ? String(filters.fandom_id) : '',
        club_id: filters.club_id ? String(filters.club_id) : '',
        league_id: filters.league_id ? String(filters.league_id) : '',
        limit: filters.limit ? String(filters.limit) : String(board.limit ?? 50),
    });

    function applyFilters(e) {
        e.preventDefault();

        const payload = { scope: values.scope, limit: values.limit };

        if (values.scope === 'fandom' && values.fandom_id) {
            payload.fandom_id = values.fandom_id;
        }

        if (values.scope === 'club' && values.club_id) {
            payload.club_id = values.club_id;
        }

        if (values.scope === 'league' && values.league_id) {
            payload.league_id = values.league_id;
        }

        router.get(route, payload, { preserveState: true, replace: true });
    }

    function resetFilters() {
        const reset = { scope: 'global', limit: '50' };
        setValues(reset);
        router.get(route, { scope: 'global', limit: 50 }, { preserveState: true, replace: true });
    }

    const columns = [
        { key: 'rank', label: 'Rank' },
        { key: 'fan', label: 'Fan' },
        { key: 'email', label: 'Email' },
        { key: 'fan_id', label: 'Fan ID' },
        { key: 'fandom', label: 'Fandom' },
        { key: 'club', label: 'Club' },
        { key: 'points', label: 'Points' },
        { key: 'loyalty', label: 'Loyalty' },
        { key: 'streak', label: 'Streak' },
    ];

    const rows = (board.entries ?? []).map((entry) => {
        const admin = entry.admin ?? {};
        const fan = entry.fan ?? {};

        return {
            ...entry,
            rank: (
                <div className="flex items-center gap-2 font-medium tabular-nums">
                    #{entry.rank}
                    {entry.is_you ? (
                        <Badge variant="outline" className="text-xs">
                            You
                        </Badge>
                    ) : null}
                </div>
            ),
            fan: (
                <div>
                    <Link
                        href={`${base}/users/${admin.id ?? fan.id}`}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                        {admin.name ?? fan.handle ?? '—'}
                    </Link>
                    {admin.username ? (
                        <div className="text-xs text-muted-foreground">@{admin.username}</div>
                    ) : null}
                </div>
            ),
            email: admin.email ?? '—',
            fan_id: admin.fan_id ?? fan.handle ?? '—',
            fandom: admin.fandom ?? '—',
            club: admin.club ?? fan.club?.name ?? '—',
            points: formatNumber(entry.points ?? 0),
            loyalty: formatNumber(entry.loyalty ?? 0),
            streak: formatNumber(fan.streak_days ?? 0),
        };
    });

    const activeScope = scopeLabel(scope, fandom, club, league);

    return (
        <AdminLayout title="Leaderboard">
            <AdminPageHeader
                title="Fan leaderboard"
                description="Rank fans by lifetime points across global, fandom, club, or league scopes."
            />

            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">{activeScope}</CardTitle>
                    <CardDescription>
                        Showing top {formatNumber(board.limit ?? 50)} of {formatNumber(board.total_fans ?? 0)} fans
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
                        <Field className="min-w-40">
                            <FieldLabel>Scope</FieldLabel>
                            <NativeSelect
                                className="w-full"
                                value={values.scope}
                                onChange={(e) => setValues((prev) => ({ ...prev, scope: e.target.value }))}
                            >
                                {scopeOptions.map((option) => (
                                    <NativeSelectOption key={option.value} value={option.value}>
                                        {option.label}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>

                        {values.scope === 'fandom' ? (
                            <Field className="min-w-48">
                                <FieldLabel>Fandom</FieldLabel>
                                <NativeSelect
                                    className="w-full"
                                    value={values.fandom_id}
                                    onChange={(e) => setValues((prev) => ({ ...prev, fandom_id: e.target.value }))}
                                >
                                    <NativeSelectOption value="">Select fandom…</NativeSelectOption>
                                    {fandoms.map((item) => (
                                        <NativeSelectOption key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                        ) : null}

                        {values.scope === 'club' ? (
                            <Field className="min-w-48">
                                <FieldLabel>Club</FieldLabel>
                                <NativeSelect
                                    className="w-full"
                                    value={values.club_id}
                                    onChange={(e) => setValues((prev) => ({ ...prev, club_id: e.target.value }))}
                                >
                                    <NativeSelectOption value="">Select club…</NativeSelectOption>
                                    {clubs.map((item) => (
                                        <NativeSelectOption key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                        ) : null}

                        {values.scope === 'league' ? (
                            <Field className="min-w-48">
                                <FieldLabel>League</FieldLabel>
                                <NativeSelect
                                    className="w-full"
                                    value={values.league_id}
                                    onChange={(e) => setValues((prev) => ({ ...prev, league_id: e.target.value }))}
                                >
                                    <NativeSelectOption value="">Select league…</NativeSelectOption>
                                    {leagues.map((item) => (
                                        <NativeSelectOption key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                        ) : null}

                        <Field className="min-w-28">
                            <FieldLabel>Limit</FieldLabel>
                            <NativeSelect
                                className="w-full"
                                value={values.limit}
                                onChange={(e) => setValues((prev) => ({ ...prev, limit: e.target.value }))}
                            >
                                {[25, 50, 75, 100].map((size) => (
                                    <NativeSelectOption key={size} value={String(size)}>
                                        Top {size}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>

                        <Button type="submit">Apply</Button>
                        <Button type="button" variant="outline" onClick={resetFilters}>
                            Reset
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <AdminTable columns={columns} rows={rows} searchPlaceholder="Search fans…" />
        </AdminLayout>
    );
}
