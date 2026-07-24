# Pagination for Flarum (`gradba/flarum-pagination`)

Real, page-numbered pagination for Flarum — for **both** the discussion list
*and* the post stream inside a discussion, in one extension with a single
settings panel.

It combines and rebuilds two excellent MIT-licensed extensions:

- **[FoskyM/flarum-pagination]** — pagination for the discussion list (index).
- **[daocatt/flarum-ext-discussion-paginator]** (gtdxyz) — pagination for the
  post stream inside a discussion.

## Why a combined rebuild?

Running the two upstream extensions together works, but the post-stream
paginator had a **janky scrolling** problem: it replaced Flarum's core
`PostStream` with a stripped-down copy that removed the entire scroll lifecycle
(`ScrollListener`, `triggerScroll`, `scrollToItem`, …). Every page change swapped
20 posts in under the reader's current scroll offset without ever repositioning
the viewport, so the page visibly jumped.

This extension fixes that by **extending** the real `PostStream` instead of
forking it: it keeps the whole scroll lifecycle intact and only disables the
infinite-scroll auto-loader. Page changes load the exact page range and let
core's `scrollToItem` scroll cleanly to the top of the page after the posts load
and the layout settles.

It also fixes a few things found while merging:

- Total-count query uses Laravel's bound `getCountForPagination()` instead of
  string-substituting bindings into SQL (the upstream approach was injection
  prone).
- Per-request count is passed through a request-scoped container singleton
  instead of the `$_REQUEST` superglobal.
- The list total-count serializer is scoped to `ListDiscussionsController` only,
  instead of every API serializer.
- Post-per-page is configurable (the original hard-coded 20).
- Pager button labels are translation keys (localised; ships `en` + `mk`).

## Settings

Admin → Extensions → Pagination:

- **Master switches** — paginate the discussion list / paginate posts inside a
  discussion (each can be turned off independently).
- **Posts per page** — page size inside a discussion.
- **Discussions per page**, pager position, per-user mode preference, load-more
  fallback sizes, and page caching for the discussion list.

## Development

```bash
cd js
npm install
npm run build     # emits js/dist/{forum,admin}.js
```

Target: Flarum `^1.8`.

## License

MIT. See [LICENSE](LICENSE) — retains the copyright notices of FoskyM,
Iulian Cernei (block-cat), and daocatt (gtdxyz).

[FoskyM/flarum-pagination]: https://github.com/FoskyM/flarum-pagination
[daocatt/flarum-ext-discussion-paginator]: https://github.com/daocatt/flarum-ext-discussion-paginator
