<?php

/*
 * This file is part of gradba/flarum-pagination.
 */

namespace Gradba\Pagination\Listing;

/**
 * Request-scoped holder for the discussion-list total count.
 *
 * FoskyM's original passed this value between the filter/search mutator and the
 * serializer through the $_REQUEST superglobal, which is not request-scoped-safe.
 * Instead we bind this class as a container singleton (see PaginationServiceProvider)
 * so the mutator that computes the count and the serializer that emits it share
 * one instance for the lifetime of a single request.
 */
class TotalCountStore
{
    private ?int $count = null;

    public function set(int $count): void
    {
        $this->count = $count;
    }

    public function get(): ?int
    {
        return $this->count;
    }
}
