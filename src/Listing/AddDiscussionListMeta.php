<?php

/*
 * This file is part of gradba/flarum-pagination.
 */

namespace Gradba\Pagination\Listing;

use Flarum\Api\Controller\AbstractSerializeController;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

/**
 * Injects the total discussion count into the JSON:API top-level `jsonapi`
 * member so the frontend can compute the number of pages. Registered ONLY on
 * ListDiscussionsController (FoskyM registered it on AbstractSerializeController,
 * which leaked totalResultsCount onto unrelated endpoints).
 */
class AddDiscussionListMeta
{
    public function __construct(private TotalCountStore $store)
    {
    }

    public function __invoke(AbstractSerializeController $controller, $data, ServerRequestInterface $request, Document $document): void
    {
        $count = $this->store->get();

        if ($count !== null) {
            $document->setJsonapi(['totalResultsCount' => $count]);
        }
    }
}
