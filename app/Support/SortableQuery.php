<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

class SortableQuery
{
    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  list<string>  $allowedColumns
     * @return Builder<TModel>
     */
    public static function apply(
        Builder $query,
        ?string $sortBy,
        ?string $sortDir,
        array $allowedColumns,
        string $defaultColumn = 'created_at',
        string $defaultDirection = 'desc',
    ): Builder {
        $column = in_array($sortBy, $allowedColumns, true) ? $sortBy : $defaultColumn;
        $direction = strtolower((string) $sortDir) === 'asc' ? 'asc' : $defaultDirection;

        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = $defaultDirection;
        }

        return $query->orderBy($column, $direction);
    }
}
