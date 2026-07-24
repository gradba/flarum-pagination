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
 * Server-side companion to the client-side page navigation for the POST STREAM.
 *
 * In paginated mode the trailing URL segment of a discussion (`/d/65-slug/3`)
 * means "page 3", not "post #3". When the server preloads a discussion page it
 * issues an internal API call carrying page[near]=<page> AND page[limit]. This
 * middleware detects that shape and converts the page number into the real post
 * index at the CENTRE of the page, plus forces the window size to postsPerPage,
 * so the preloaded post window matches the requested page.
 *
 * The presence of page[limit] is the signal that `near` is a page number: the
 * frontend's own runtime navigation (goToNumber/goToIndex) sends a real post
 * number WITHOUT a limit, so it is never touched here — avoiding the
 * double-conversion bug present in the original gtdxyz middleware.
 */
class ConvertPostStreamNear implements MiddlewareInterface
{
    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public function process(Request $request, Handler $handler): Response
    {
        if ($request->getMethod() === 'GET'
            && $this->settings->get('gradba-pagination.enablePostStream')
            // Single discussion endpoint (/api/discussions/{id}); the trailing
            // slash excludes the list endpoint (/api/discussions).
            && strpos($request->getUri()->getPath(), '/discussions/') !== false
        ) {
            $params = $request->getQueryParams();

            if (isset($params['page']['near'], $params['page']['limit'])
                && is_numeric($params['page']['near'])
            ) {
                $page = (int) $params['page']['near'];
                $perPage = (int) ($this->settings->get('gradba-pagination.postsPerPage') ?: 20);

                if ($page > 0 && $perPage > 0) {
                    $params['page']['near'] = ($page - 1) * $perPage + 1 + intdiv($perPage, 2);
                    $params['page']['limit'] = $perPage;
                    $request = $request->withQueryParams($params);
                }
            }
        }

        return $handler->handle($request);
    }
}
