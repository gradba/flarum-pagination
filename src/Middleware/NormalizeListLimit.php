<?php

/*
 * This file is part of gradba/flarum-pagination.
 */

namespace Gradba\Pagination\Middleware;

use Flarum\Settings\SettingsRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;

/**
 * When a client sends the stock default page[limit]=20 for the DISCUSSION LIST,
 * rewrite it to the configured page size (perPage in pagination mode,
 * perIndexInit in load-more mode) so the first/preloaded page has the right
 * number of rows. Only touches the default 20 — explicit client limits pass
 * through untouched. Scoped to the list endpoint (/api/discussions), not to
 * single-discussion or other API calls.
 */
class NormalizeListLimit implements MiddlewareInterface
{
    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public function process(Request $request, Handler $handler): Response
    {
        if ($request->getMethod() === 'GET'
            && $this->settings->get('gradba-pagination.enableDiscussionList')
            && preg_match('#/discussions/?$#', $request->getUri()->getPath())
        ) {
            $params = $request->getQueryParams();
            $limit = (int) ($params['page']['limit'] ?? 20);

            if ($limit === 20) {
                if ($this->settings->get('gradba-pagination.paginationOnLoading')) {
                    $perPage = (int) ($this->settings->get('gradba-pagination.perPage') ?: 20);
                } else {
                    $perPage = (int) ($this->settings->get('gradba-pagination.perIndexInit') ?: 20);
                }

                if ($perPage !== 20) {
                    $params['page']['limit'] = $perPage;
                    $request = $request->withQueryParams($params);
                }
            }
        }

        return $handler->handle($request);
    }
}
