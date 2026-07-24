import type PostStreamState from 'flarum/forum/states/PostStreamState';

// `m` (mithril) is a runtime global in Flarum — no import needed.
declare const m: any;

/**
 * Navigate the post stream to a specific page of posts.
 *
 * This is the heart of the scroll fix. Rather than fork a stripped copy of
 * PostStream (as the original gtdxyz extension did — deleting the scroll
 * lifecycle and leaving every page change un-anchored), we drive the *real*
 * PostStreamState:
 *
 *   1. `reset(start, end)` synchronously sets visibleStart/visibleEnd, so the
 *      (retained, un-forked) PostStream component immediately renders
 *      `data-index` placeholders for every post on the page.
 *   2. We load exactly that range (never a centred window), so any posts-per-page
 *      value works — not just 20.
 *   3. We set `targetPost` to the page's FIRST index and `needsScroll = true`.
 *      Core PostStream's `triggerScroll -> scrollToItem` (which we keep) then
 *      scrolls the viewport to the top of the page once the range has loaded and
 *      the DOM heights have settled, and finally clears `paused`.
 *
 * The result is a page change that lands cleanly at the top of the page with no
 * jump, no forced sync-redraw fighting the browser, and no stale scroll offset.
 */
export default function goToPage(stream: PostStreamState, page: number, perPage: number, noAnimation = false): Promise<void> {
  const s = stream as any;

  const total = s.count();
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const target = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);

  const start = (target - 1) * perPage;
  const end = start + perPage;

  s.paused = true;

  // (1) Render placeholders for the exact page range straight away.
  s.reset(start, end);

  // (2) Load exactly this page's posts (fetches only what isn't already cached).
  s.loadPromise = s.loadRange(start, end).then(s.show.bind(s));

  // (3) Anchor the scroll to the first post of the page.
  s.needsScroll = true;
  s.targetPost = { index: start };
  s.animateScroll = !noAnimation;
  s.index = start;

  m.redraw();

  return s.loadPromise;
}
