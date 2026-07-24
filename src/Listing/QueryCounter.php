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

use Illuminate\Database\Eloquent\Builder;

class QueryCounter
{
    /**
     * Count all rows the given (already-filtered) query would return, ignoring
     * any LIMIT/OFFSET/ORDER BY that pagination may have applied.
     */
    public static function count(Builder $query): int
    {
        $base = (clone $query)->toBase();

        // Drop pagination + ordering so the count reflects the whole result set.
        $base->limit = null;
        $base->offset = null;
        $base->orders = null;

        return $base->getCountForPagination();
    }
}
