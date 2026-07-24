<?php

/*
 * This file is part of gradba/flarum-pagination.
 */

namespace Gradba\Pagination\Provider;

use Flarum\Foundation\AbstractServiceProvider;
use Gradba\Pagination\Listing\TotalCountStore;

class PaginationServiceProvider extends AbstractServiceProvider
{
    public function register(): void
    {
        // One instance per request, shared by the filter/search mutators and the
        // list serializer so the total count survives from query-build to output.
        $this->container->singleton(TotalCountStore::class);
    }
}
