<?php

/*
 * This file is part of gradba/flarum-pagination.
 */

namespace Gradba\Pagination\Listing;

use Flarum\Query\QueryCriteria;
use Flarum\Search\SearchState;

/**
 * Same as DiscussionFilterMutator but for the search path (filter[q] present),
 * which flows through DiscussionSearcher instead of DiscussionFilterer. Without
 * this, pagination counts break whenever the list is a search result.
 */
class DiscussionSearchMutator
{
    public function __construct(private TotalCountStore $store)
    {
    }

    public function __invoke(SearchState $searchState, QueryCriteria $criteria): void
    {
        $this->store->set(QueryCounter::count($searchState->getQuery()));
    }
}
