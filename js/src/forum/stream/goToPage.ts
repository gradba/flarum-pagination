import type PostStreamState from 'flarum/forum/states/PostStreamState';

// `m` (mithril) is a runtime global in Flarum — no import needed.
declare const m: any;

/**
 * Navigate the post stream to a specific page of posts.
 *
 * We drive the *real* core PostStreamState (never a forked stream), loading the
 * EXACT range for the page and anchoring the scroll target to the page's first
 * post. Because the paginated stream component we render extends core PostStream
 * (keeping ScrollListener / triggerScroll / scrollToItem intact), the redraw
 * below makes the component repaint the new range and then run its normal
 * onupdate -> triggerScroll -> scrollToItem lifecycle, which scrolls the
 * viewport to the top of the page once the posts have loaded and the DOM has
 * settled. No forced sync-redraw fighting the browser, no stale scroll offset.
 */
export default function goToPage(
  stream: PostStreamState,
  page: number,
  perPage: number,
  noAnimation = false,
  scrollIndex: number | null = null
): Promise<void> {
  const s = stream as any;

  const total = s.count();
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const target = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);

  const start = (target - 1) * perPage;
  const end = start + perPage;

  // The loaded range is always the exact page; `scrollIndex` (used by the initial
  // deep-link snap) only changes which post inside that page we scroll to —
  // otherwise we anchor to the page's first post.
  const anchor = scrollIndex != null ? scrollIndex : start;

  s.paused = true;
  s.needsScroll = true;
  s.targetPost = { index: anchor };
  s.animateScroll = !noAnimation;
  s.index = anchor;

  const promise = s.loadRange(start, end).then((posts: any[]) => {
    s.show(posts);
    m.redraw();
  });

  // scrollToItem waits on stream.loadPromise before its post-render scroll pass.
  s.loadPromise = promise;

  return promise;
}
