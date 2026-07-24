<?php

/*
 * This file is part of gradba/flarum-pagination.
 *
 * A combined pagination extension for Flarum that provides:
 *   1. Page-number pagination for the DISCUSSION LIST (derived from
 *      FoskyM/flarum-pagination, MIT).
 *   2. Page-number pagination for the POST STREAM inside a discussion
 *      (derived from daocatt/flarum-ext-discussion-paginator, MIT), rebuilt to
 *      extend core PostStream so the scroll lifecycle stays intact.
 *
 * For detailed copyright and license information, see the LICENSE file.
 */

use Flarum\Api\Controller\ListDiscussionsController;
use Flarum\Discussion\Filter\DiscussionFilterer;
use Flarum\Discussion\Search\DiscussionSearcher;
use Flarum\Extend;
use Flarum\Flags\Api\Serializer\FlagSerializer;
use Flarum\Flags\Flag;
use Flarum\Notification\Notification;
use Flarum\Api\Serializer\NotificationSerializer;
use Flarum\Settings\SettingsRepositoryInterface;
use Gradba\Pagination\Listing\AddDiscussionListMeta;
use Gradba\Pagination\Listing\DiscussionFilterMutator;
use Gradba\Pagination\Listing\DiscussionSearchMutator;
use Gradba\Pagination\Middleware\ConvertPostStreamNear;
use Gradba\Pagination\Middleware\NormalizeListLimit;
use Gradba\Pagination\Provider\PaginationServiceProvider;

/**
 * Real post number -> page number, using the configured posts-per-page. Used to
 * make mention/flag "jump to post #N" links land on the correct page.
 */
$toPage = function (int $number): int {
    $perPage = (int) (resolve(SettingsRepositoryInterface::class)->get('gradba-pagination.postsPerPage') ?: 20);

    return (int) max(1, ceil($number / max(1, $perPage)));
};

return [
    // --- Frontend assets ---------------------------------------------------
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/resources/less/admin.less'),

    new Extend\Locales(__DIR__ . '/resources/locale'),

    // --- Request-scoped services ------------------------------------------
    (new Extend\ServiceProvider())
        ->register(PaginationServiceProvider::class),

    // --- Settings ----------------------------------------------------------
    (new Extend\Settings())
        ->serializeToForum('gradba-pagination.enableDiscussionList', 'gradba-pagination.enableDiscussionList', 'boolVal')
        ->serializeToForum('gradba-pagination.enablePostStream', 'gradba-pagination.enablePostStream', 'boolVal')
        ->serializeToForum('gradba-pagination.canUserPref', 'gradba-pagination.canUserPref', 'boolVal')
        ->serializeToForum('gradba-pagination.paginationOnLoading', 'gradba-pagination.paginationOnLoading', 'boolVal')
        ->serializeToForum('gradba-pagination.cacheDiscussions', 'gradba-pagination.cacheDiscussions', 'boolVal')
        ->serializeToForum('gradba-pagination.perPage', 'gradba-pagination.perPage', 'intVal')
        ->serializeToForum('gradba-pagination.perIndexInit', 'gradba-pagination.perIndexInit', 'intVal')
        ->serializeToForum('gradba-pagination.perLoadMore', 'gradba-pagination.perLoadMore', 'intVal')
        ->serializeToForum('gradba-pagination.paginationPosition', 'gradba-pagination.paginationPosition')
        ->serializeToForum('gradba-pagination.postsPerPage', 'gradba-pagination.postsPerPage', 'intVal')
        ->default('gradba-pagination.enableDiscussionList', true)
        ->default('gradba-pagination.enablePostStream', true)
        ->default('gradba-pagination.canUserPref', false)
        ->default('gradba-pagination.paginationOnLoading', true)
        ->default('gradba-pagination.cacheDiscussions', true)
        ->default('gradba-pagination.perPage', 20)
        ->default('gradba-pagination.perIndexInit', 20)
        ->default('gradba-pagination.perLoadMore', 20)
        ->default('gradba-pagination.paginationPosition', 'under')
        ->default('gradba-pagination.postsPerPage', 20),

    // --- Per-user preference (discussion list) -----------------------------
    (new Extend\User())
        ->registerPreference('gradba-pagination.userCustom', 'boolVal', false)
        ->registerPreference('gradba-pagination.userPaginationOnLoading', 'boolVal', true),

    // --- Discussion-list total count --------------------------------------
    (new Extend\ApiController(ListDiscussionsController::class))
        ->prepareDataForSerialization(AddDiscussionListMeta::class),

    (new Extend\Filter(DiscussionFilterer::class))
        ->addFilterMutator(DiscussionFilterMutator::class),

    (new Extend\SimpleFlarumSearch(DiscussionSearcher::class))
        ->addSearchMutator(DiscussionSearchMutator::class),

    // --- Middleware --------------------------------------------------------
    (new Extend\Middleware('api'))
        ->add(NormalizeListLimit::class)
        ->add(ConvertPostStreamNear::class),

    // --- Jump-link fixups: convert real post numbers to page numbers -------
    (new Extend\Conditional())
        ->whenExtensionEnabled('flarum-mentions', [
            (new Extend\ApiSerializer(NotificationSerializer::class))
                ->attribute('content', function ($serializer, Notification $notification) use ($toPage) {
                    if ($notification->type === 'postMentioned'
                        && is_array($notification->data)
                        && array_key_exists('replyNumber', $notification->data)
                    ) {
                        $data = $notification->data;
                        $data['replyNumber'] = $toPage((int) $data['replyNumber']);

                        return $data;
                    }

                    return $notification->data;
                })
                ->attribute('subject', function ($serializer, Notification $notification) use ($toPage) {
                    if ($notification->type === 'userMentioned' && $notification->subject) {
                        $subject = $notification->subject;
                        $subject->number = $toPage((int) $subject->number);

                        return $subject;
                    }

                    return $notification->subject;
                }),
        ]),

    (new Extend\Conditional())
        ->whenExtensionEnabled('flarum-flags', [
            (new Extend\ApiSerializer(FlagSerializer::class))
                ->attribute('post', function ($serializer, Flag $flag) use ($toPage) {
                    if ($flag->post) {
                        $post = $flag->post;
                        $post->number = $toPage((int) $post->number);

                        return $post;
                    }

                    return $flag->post;
                }),
        ]),
];
