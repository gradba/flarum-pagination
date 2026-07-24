<?php

/*
 * This file is part of gradba/flarum-pagination.
 */

namespace Gradba\Pagination\Listing;

use Flarum\Filter\FilterState;
use Flarum\Query\QueryCriteria;

/**
 * Runs for the standard (non-search) discussion list. Computes the total number
 * of discussions the filtered query would return and stashes it in the
 * request-scoped store, where AddDiscussionListMeta reads it back.
 */
class DiscussionFilterMutator
{
    public function __construct(private TotalCountStore $store)
    {
    }

    public function __invoke(FilterState $filterState, QueryCriteria $criteria): void
    {
        $this->store->set(QueryCounter::count($filterState->getQuery()));
    }
}
