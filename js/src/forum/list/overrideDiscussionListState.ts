import app from 'flarum/forum/app';
import { override } from 'flarum/common/extend';
import DiscussionListState from 'flarum/forum/states/DiscussionListState';
import Stream from 'flarum/common/utils/Stream';

import determineMode, { listEnabled } from './determineMode';

/**
 * Discussion-list pagination state, ported from FoskyM/flarum-pagination (MIT).
 * Setting keys renamed to `gradba-pagination.*`, and every override short-circuits
 * to the original when the feature is switched off.
 */
export default function overrideDiscussionListState() {
  (DiscussionListState.prototype as any).initOptions = function () {
    this.options = {
      cacheDiscussions: app.forum.attribute('gradba-pagination.cacheDiscussions'),
      perPage: app.forum.attribute('gradba-pagination.perPage'),
      perLoadMore: app.forum.attribute('gradba-pagination.perLoadMore'),
      perIndexInit: app.forum.attribute('gradba-pagination.perIndexInit'),
      leftEdges: 4,
      rightEdges: 5,
    };
    this.usePaginationMode = determineMode();
    this.lastTotalDiscussionCount = 0;
    this.lastTotalPages = 0;
    this.lastDiscussions = [];
    this.lastLoadedPage = {};
    this.lastRequestParams = {};

    this.optionInitialized = true;
  };

  override(DiscussionListState.prototype, 'refresh', function (this: any, original, page = 1) {
    if (!listEnabled()) return original(page);
    if (!this.optionInitialized) this.initOptions();

    if (!this.usePaginationMode) {
      this.pageSize = this.options.perLoadMore;
      return original(page);
    }

    this.initialLoading = true;
    this.loadingPrev = false;
    this.loadingNext = false;

    this.isRefreshing = true;

    this.clear();

    this.location = { page };

    return this.loadPage(page)
      .then((results: any) => {
        this.pages = [];
        this.parseResults(this.location.page, results);
      })
      .finally(() => {
        this.initialLoading = false;
        this.isRefreshing = false;
      });
  });

  override(DiscussionListState.prototype, 'loadPage', function (this: any, original, page = 1) {
    if (!listEnabled()) return original(page);
    const reqParams = this.requestParams();
    if (!this.optionInitialized) this.initOptions();
    if (!this.lastRequestParams['include']) {
      this.lastRequestParams = reqParams;
    }

    const preloadedDiscussions = app.preloadedApiDocument();
    if (preloadedDiscussions) {
      this.initialLoading = false;
      this.isRefreshing = false;
      this.totalDiscussionCount = Stream((preloadedDiscussions as any).payload.jsonapi.totalResultsCount);
      this.lastTotalDiscussionCount = this.totalDiscussionCount();

      return Promise.resolve(preloadedDiscussions);
    }

    if (!this.isRefreshing && this.options.cacheDiscussions) {
      if (
        JSON.stringify(reqParams['include']) !== JSON.stringify(this.lastRequestParams['include']) ||
        JSON.stringify(reqParams['filter']) !== JSON.stringify(this.lastRequestParams['filter.q']) ||
        reqParams['sort'] !== this.lastRequestParams['sort']
      ) {
        if (this.lastLoadedPage[page]) {
          let start = this.options.perPage * (page - 1);
          let end = this.options.perPage * page;
          let results: any = this.lastDiscussions.slice(start, end);
          results.payload = { jsonapi: { totalResultsCount: this.totalDiscussionCount() } };

          // for `walsgit/flarum-discussion-cards`: if we resolve immediately the
          // card items would not redraw in cache mode, so nudge a redraw first.
          this.initialLoading = true;
          m.redraw();
          return new Promise((resolve) => setTimeout(() => resolve(results), 50));
        }
      }
    }

    const include = Array.isArray(reqParams.include) ? reqParams.include.join(',') : reqParams.include;

    let newOffset, newLimit;

    if (this.usePaginationMode) {
      newOffset = this.options.perPage * (page - 1);
      newLimit = this.options.perPage;
    } else {
      newOffset = this.options.perIndexInit * Math.min(page - 1, 1) + this.options.perLoadMore * Math.max(page - 2, 0);
      newLimit = newOffset == 0 ? this.options.perIndexInit : this.options.perLoadMore;
    }

    const params = {
      ...reqParams,
      page: {
        ...reqParams.page,
        offset: newOffset,
        limit: newLimit,
      },
      include,
    };

    return app.store.find(this.type, params);
  });

  override(DiscussionListState.prototype, 'parseResults', function (this: any, original, pg, results) {
    if (!listEnabled() || !this.usePaginationMode) {
      return original(pg, results);
    }
    const pageNum = Number(pg);

    const links = results.payload?.links || {};

    const page = {
      number: pageNum,
      items: results,
      hasNext: !!links?.next,
      hasPrev: !!links?.prev,
    };

    this.hasPage = function (p: number) {
      let allPages = this.getPages(true);
      if (allPages.length == 0) return false;
      for (let i = 0; i < allPages.length; i++) {
        if (allPages[i].number == p) return true;
      }
      return false;
    };

    if (!this.hasPage(pageNum)) {
      this.pages.push(page);
    }

    this.pages = this.pages.sort((a: any, b: any) => a.number - b.number);

    this.location = { page: pageNum };

    this.totalDiscussionCount = Stream(results.payload.jsonapi.totalResultsCount);

    if (this.options.cacheDiscussions) {
      if (
        (this.lastTotalDiscussionCount != this.totalDiscussionCount() && this.lastTotalDiscussionCount != 0) ||
        this.lastTotalDiscussionCount === 0 ||
        this.isRefreshing
      ) {
        this.lastTotalDiscussionCount = this.totalDiscussionCount();
        for (let i = 0; i < this.lastTotalDiscussionCount; i++) {
          this.lastDiscussions[i] = {};
        }
        this.lastLoadedPage = {};
      } else {
        this.lastLoadedPage[pageNum] = page;
        let start = this.options.perPage * (pageNum - 1);
        let end = this.options.perPage * pageNum;
        this.lastDiscussions.splice(start, end - start, ...results);
      }
    }

    this.getTotalPages = function () {
      return Math.ceil(this.totalDiscussionCount() / this.options.perPage);
    };

    this.page = Stream(page);
    this.perPage = Stream(this.options.perPage);
    this.totalPages = Stream(this.getTotalPages());

    this.ctrl = {
      scrollToTop: function () {
        const container = document.querySelector('#content > .IndexPage > .container');
        const header = document.querySelector('#header');
        let offsetY = 0;
        if (header) {
          offsetY = (header as HTMLElement).clientHeight;
        }
        if (container) {
          const targetPosition = container.getBoundingClientRect().top + window.scrollY - offsetY;
          setTimeout(() => {
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
          }, 50);
        }
      },
      prevPage: function (this: any) {
        let current = this.page().number;
        --current;

        if (current < 1) {
          return;
        }

        this.page(current);
        let next = current;
        this.loadingPrev = true;
        this.loadPage(next).then((results: any) => {
          this.parseResults(next, results);
          this.loadingPrev = false;
          this.ctrl.scrollToTop();
        });
      }.bind(this),

      nextPage: function (this: any) {
        let current = this.page().number;
        ++current;

        if (current > this.totalPages()) {
          current = this.totalPages();
          return;
        }

        this.page(current);
        let next = current;
        this.loadingNext = true;
        this.loadPage(next).then((results: any) => {
          this.parseResults(next, results);
          this.loadingNext = false;
          this.ctrl.scrollToTop();
        });
      }.bind(this),

      toPage: function (this: any, p: any) {
        if (this.page().number == Number(p) || p < 1 || p > this.totalPages()) return;

        this.page(Number(p));
        let next = Number(p);

        this.initialLoading = true;

        this.loadPage(next).then((results: any) => {
          this.parseResults(next, results);
          this.initialLoading = false;
          this.ctrl.scrollToTop();
        });
      }.bind(this),

      pageList: function (this: any) {
        let p = [],
          left = Math.max(parseInt(this.page().number) - this.options.leftEdges, 1),
          right = Math.min(parseInt(this.page().number) + this.options.rightEdges, this.totalPages());

        for (let i = left; i <= right; i++) {
          p.push(i);
        }

        return p;
      }.bind(this),
    };

    m.redraw();
  });

  override(DiscussionListState.prototype, 'addDiscussion', function (this: any, original, discussion) {
    if (!listEnabled() || !this.usePaginationMode) {
      return original(discussion);
    }
    const index = this.lastDiscussions.indexOf(discussion);

    if (index !== -1) {
      this.lastDiscussions.splice(index);
      this.lastDiscussions.unshift(discussion);
    } else {
      this.lastDiscussions.unshift(discussion);
      this.lastTotalDiscussionCount++;
      this.totalDiscussionCount(this.lastTotalDiscussionCount);
    }

    m.redraw();
  });

  override(DiscussionListState.prototype, 'deleteDiscussion', function (this: any, original, discussion) {
    if (!listEnabled() || !this.usePaginationMode) {
      return original(discussion);
    }
    const index = this.lastDiscussions.indexOf(discussion);

    if (index !== -1) {
      this.lastDiscussions.splice(index);
      this.lastTotalDiscussionCount--;
      this.totalDiscussionCount(this.lastTotalDiscussionCount);
    }

    m.redraw();
  });

  override(DiscussionListState.prototype, 'clear', function (this: any, original) {
    if (!listEnabled() || !this.usePaginationMode) {
      return original();
    }
    this.lastDiscussions = [];
    this.lastLoadedPage = {};
    this.lastRequestParams = {};
    this.lastTotalDiscussionCount = 0;
    this.lastTotalPages = 0;
    this.totalDiscussionCount = Stream(0);
    return original();
  });
}
