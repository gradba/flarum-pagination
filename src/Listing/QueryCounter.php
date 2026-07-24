<?php

/*
 * This file is part of gradba/flarum-pagination.
 *
 * Derived from FoskyM/flarum-pagination (MIT). The original computed the
 * total row count by string-substituting bindings into the SQL and running
 * vsprintf() — which is injection-prone. This reimplementation uses Laravel's
 * own bound getCountForPagination(), which handles group-by / distinct / joins
 * safely with proper parameter binding.
 */

namespace Gradba\Pagination\Listing;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;

class QueryCounter
{
    /**
     * Count all rows the given (already-filtered) query would return, ignoring
     * any LIMIT/OFFSET/ORDER BY that pagination may have applied.
     *
     * Flarum's FilterState::getQuery() hands us a base Query\Builder, while some
     * callers pass an Eloquent\Builder — accept either.
     */
    public static function count(QueryBuilder|EloquentBuilder $query): int
    {
        $base = $query instanceof EloquentBuilder ? $query->toBase() : $query;

        // getCountForPagination() clones the query internally (without
        // columns/orders/limit/offset), so it does not mutate the caller's
        // query, and it counts correctly across group-by / distinct / joins.
        return (int) $base->getCountForPagination();
    }
}
