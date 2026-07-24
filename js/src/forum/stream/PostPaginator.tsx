import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import type Mithril from 'mithril';
import type PostStreamState from 'flarum/forum/states/PostStreamState';

import goToPage from './goToPage';

export interface PostPaginatorAttrs {
  stream: PostStreamState;
  perPage: number;
}

/**
 * The numbered pager rendered at the foot of a paginated post stream.
 *
 * Current page and page count are derived from a single, stable basis — the
 * post INDEX (discussion.postIds().length) — so event posts and deleted-post
 * number gaps can't drift the "current page" the way the original
 * Math.round(visibleStart / 20) did.
 */
export default class PostPaginator extends Component<PostPaginatorAttrs> {
  view(vnode: Mithril.Vnode<PostPaginatorAttrs, this>) {
    const stream = this.attrs.stream as any;
    const perPage = this.attrs.perPage;

    const total = stream.count();
    const pageCount = Math.max(1, Math.ceil(total / perPage));

    // Nothing to paginate.
    if (pageCount <= 1) return null;

    const current = Math.min(pageCount, Math.floor(stream.visibleStart / perPage) + 1);

    return (
      <nav className="GradbaPostPaginator" aria-label={this.transText('aria_label')}>
        <ul className="GradbaPostPaginator-items">
          <li>{this.navButton('fas fa-angles-left', 1, current === 1, 'first')}</li>
          <li>{this.navButton('fas fa-angle-left', current - 1, current === 1, 'previous')}</li>
          {this.pageList(current, pageCount).map((page) => (
            <li>
              <Button
                className={'Button Button--link GradbaPostPaginator-page' + (page === current ? ' Button--active' : '')}
                onclick={() => this.goto(page)}
              >
                {page}
              </Button>
            </li>
          ))}
          <li>{this.navButton('fas fa-angle-right', current + 1, current === pageCount, 'next')}</li>
          <li>{this.navButton('fas fa-angles-right', pageCount, current === pageCount, 'last')}</li>
        </ul>
      </nav>
    );
  }

  navButton(icon: string, page: number, disabled: boolean, key: string) {
    return Button.component({
      className: 'Button Button--icon Button--link',
      icon,
      disabled,
      title: this.transText(key),
      'aria-label': this.transText(key),
      onclick: () => this.goto(page),
    });
  }

  transText(key: string): string {
    return app.translator.trans('gradba-pagination.forum.post_stream.' + key, {}, true) as string;
  }

  goto(page: number) {
    const stream = this.attrs.stream as any;
    const perPage = this.attrs.perPage;
    const pageCount = Math.max(1, Math.ceil(stream.count() / perPage));
    const target = Math.min(Math.max(1, page), pageCount);

    if (target === Math.floor(stream.visibleStart / perPage) + 1) return;

    // goToPage loads the page and redraws; core's scroll lifecycle then moves
    // the viewport and calculatePosition() updates the URL to the new top post.
    goToPage(stream, target, perPage);
  }

  /** Sliding window of page numbers around the current page. */
  pageList(current: number, total: number): number[] {
    const edge = 4;
    const left = Math.max(1, current - edge);
    const right = Math.min(total, current + edge);
    const pages: number[] = [];
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  }
}
