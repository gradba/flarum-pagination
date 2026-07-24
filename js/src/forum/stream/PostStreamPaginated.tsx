import app from 'flarum/forum/app';
import PostStream from 'flarum/forum/components/PostStream';
import type Mithril from 'mithril';

import PostPaginator from './PostPaginator';

/**
 * A post stream that shows one page of posts at a time.
 *
 * Crucially this EXTENDS core PostStream rather than replacing it, so the entire
 * scroll lifecycle — ScrollListener, triggerScroll, scrollToItem, onscroll,
 * updateScrubber, onremove — stays intact. We change only two things:
 *
 *   - `loadPostsIfNeeded` becomes a no-op, so scrolling within a page never
 *     auto-loads the adjacent page (that's the pager's job now). All other
 *     onscroll work (position tracking) still runs.
 *   - `view` appends the pager and strips the stock "Load more" button.
 */
export default class PostStreamPaginated extends PostStream {
  postsPerPage(): number {
    return parseInt(app.forum.attribute('gradba-pagination.postsPerPage')) || 20;
  }

  // Suppress infinite-scroll auto-loading; keep everything else.
  loadPostsIfNeeded() {
    // no-op — pagination replaces infinite scroll.
  }

  view(vnode: Mithril.Vnode) {
    const vdom: any = super.view(vnode);

    if (vdom && Array.isArray(vdom.children)) {
      // Drop the core "Load more" button — it has no place in paginated mode.
      vdom.children = vdom.children.filter((child: any) => !(child && child.key === 'loadMore'));

      vdom.children.push(
        <div className="PostStream-pagination" key="gradba-paginator">
          <PostPaginator stream={this.stream} perPage={this.postsPerPage()} onPageChange={this.attrs.onPageChange} />
        </div>
      );
    }

    return vdom;
  }
}
