import app from 'flarum/forum/app';

/**
 * Decide whether the discussion list should use page-number pagination (true)
 * or the "load more" / infinite-scroll style (false), honouring the forum
 * default and — when enabled — the per-user preference.
 *
 * Ported from FoskyM/flarum-pagination (MIT), keys renamed to gradba-pagination.
 */
export default function determineMode(): boolean {
  if (app.session.user === null) {
    return app.forum.attribute('gradba-pagination.paginationOnLoading');
  }

  const preferences = app.session.user.preferences() as any;

  if (app.forum.attribute('gradba-pagination.canUserPref')) {
    if (!preferences['gradba-pagination.userCustom']) {
      return app.forum.attribute('gradba-pagination.paginationOnLoading');
    } else {
      if (!preferences['gradba-pagination.userPaginationOnLoading']) {
        return false;
      }
    }
  } else {
    return app.forum.attribute('gradba-pagination.paginationOnLoading');
  }

  return true;
}

/** Whether the discussion-list pagination feature is switched on at all. */
export function listEnabled(): boolean {
  return !!app.forum.attribute('gradba-pagination.enableDiscussionList');
}
