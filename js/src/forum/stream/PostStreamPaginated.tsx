import app from 'flarum/forum/app';
import PostStream from 'flarum/forum/components/PostStream';
import type Mithril from 'mithril';

import PostPaginator from './PostPaginator';
import goToPage from './goToPage';

/**
 * A post stream that shows one page of posts at a time.
 *
 * Crucially this EXTENDS core PostStream rather than replacing it, so the entire
 * scroll lifecycle — ScrollListener, triggerScroll, scrollToItem, onscroll,
 * updateScrubber, onremove — stays intact. We change three things:
 *
 *   - `loadPostsIfNeeded` becomes a no-op, so scrolling within a page never
 *     auto-loads the adjacent page (that's the pager's job now). All other
 *     onscroll work (position tracking / read state) still runs.
 *   - `oncreate` snaps the initial window to a single exact page (core loads a
 *     wider window around the deep-linked post, which would otherwise bleed the
 *     next page's posts onto this one).
 *   - `view` renders the pager (top and/or bottom) and strips the "Load more".
 */
export default class PostStreamPaginated extends PostStream {
  private snapped = false;

  postsPerPage(): number {
    return parseInt(app.forum.attribute('gradba-pagination.postsPerPage')) || 20;
  }

  // Suppress infinite-scroll auto-loading; keep everything else.
  loadPostsIfNeeded() {
    // no-op — pagination replaces infinite scroll.
  }

  oncreate(vnode: Mithril.Vnode) {
    super.oncreate(vnode);
    if (this.snapped) return;
    this.snapped = true;

    const s = this.stream as any;
    const perPage = this.postsPerPage();
    const total = s.count();
    if (total <= perPage) return; // single page — nothing to constrain

    // Which post index did core position us on? Prefer the target post's real
    // index; fall back to the (centred) window start.
    let idx = s.visibleStart;
    const tp = s.targetPost;
    if (tp && typeof tp.number === 'number') {
      const post = s.posts().find((p: any) => p && p.number() === tp.number);
      if (post) {
        const at = this.discussion.postIds().indexOf(post.id());
        if (at >= 0) idx = at;
      }
    } else if (tp && typeof tp.index === 'number') {
      idx = tp.index;
    }

    const page = Math.floor(idx / perPage) + 1;
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, total);

    // Only reload if core's window isn't already exactly this page.
    if (s.visibleStart !== start || s.visibleEnd !== end) {
      goToPage(this.stream, page, perPage, true, idx);
    }
  }

  view(vnode: Mithril.Vnode) {
    const vdom: any = super.view(vnode);
    if (!vdom || !Array.isArray(vdom.children)) return vdom;

    // Drop the core "Load more" button — it has no place in paginated mode.
    vdom.children = vdom.children.filter((child: any) => !(child && child.key === 'loadMore'));

    const position = app.forum.attribute('gradba-pagination.postStreamPosition') || 'both';
    const pager = (key: string) => (
      <div className="PostStream-pagination" key={key}>
        <PostPaginator stream={this.stream} perPage={this.postsPerPage()} />
      </div>
    );

    // Bottom: right after the posts (before the reply placeholder when shown).
    if (position === 'under' || position === 'both') {
      const replyIndex = vdom.children.findIndex((child: any) => child && child.key === 'reply');
      const bottom = pager('gradba-paginator-bottom');
      if (replyIndex >= 0) vdom.children.splice(replyIndex, 0, bottom);
      else vdom.children.push(bottom);
    }

    // Top: above the first post.
    if (position === 'above' || position === 'both') {
      vdom.children.unshift(pager('gradba-paginator-top'));
    }

    return vdom;
  }
}
