import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import CommentPost from 'flarum/forum/components/CommentPost';
import PostStreamState from 'flarum/forum/states/PostStreamState';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import type Post from 'flarum/common/models/Post';

import PostStreamPaginated from './PostStreamPaginated';
import goToPage from './goToPage';

function enabled(): boolean {
  return !!app.forum.attribute('gradba-pagination.enablePostStream');
}

function perPage(): number {
  return parseInt(app.forum.attribute('gradba-pagination.postsPerPage')) || 20;
}

/**
 * Turns the in-discussion post stream into a paginated one. In paginated mode
 * the trailing URL segment of a discussion (`/d/65-slug/3`) is a PAGE number,
 * not a post number.
 */
export default function overrideDiscussionPage() {
  // Show the real post number on each comment.
  extend(CommentPost.prototype, 'headerItems', function (this: any, items) {
    if (!enabled()) return;
    const post = this.attrs.post;
    if (post.isHidden && post.isHidden()) return;
    items.add(
      'gradba-postnumber',
      <div className="GradbaPostNumber">
        <span>#</span>
        {post.number()}
      </div>,
      0
    );
  });

  // The scrubber's continuous-scroll model doesn't fit page navigation.
  extend(DiscussionPage.prototype, 'sidebarItems', function (this: any, items) {
    if (!enabled()) return;
    if (items.has('scrubber')) items.remove('scrubber');
  });

  // In the discussion list, "jump to last/unread post" should target a PAGE.
  override(DiscussionListItem.prototype, 'getJumpTo', function (this: any, original) {
    if (!enabled()) return original();
    const number = original();
    if (!number) return number;
    return Math.max(1, Math.ceil(number / perPage()));
  });

  // Set the stream up on the page indicated by the (page-number) URL segment.
  override(DiscussionPage.prototype, 'show', function (this: any, original, discussion) {
    if (!enabled()) return original(discussion);

    app.history.push('discussion', discussion.title());
    app.setTitle(discussion.title());
    app.setTitleCount(0);

    const pp = perPage();

    let includedPosts: Post[] = [];
    if (discussion.payload && discussion.payload.included) {
      const discussionId = discussion.id();

      includedPosts = discussion.payload.included
        .filter(
          (record: any) =>
            record.type === 'posts' &&
            record.relationships &&
            record.relationships.discussion &&
            !Array.isArray(record.relationships.discussion.data) &&
            record.relationships.discussion.data.id === discussionId
        )
        .map((record: any) => app.store.getById('posts', record.id) as Post)
        .sort((a: Post, b: Post) => a.number() - b.number())
        .slice(0, pp);
    }

    this.stream = new PostStreamState(discussion, includedPosts);

    const rawNear = m.route.param('near');
    let page: number;
    if (rawNear === 'reply') {
      page = Math.max(1, Math.ceil(this.stream.count() / pp));
    } else {
      page = parseInt(rawNear) || 1;
    }

    goToPage(this.stream, page, pp, true).then(() => {
      this.discussion = discussion;
      app.current.set('discussion', discussion);
      app.current.set('stream', this.stream);
    });
  });

  // Render the paginated stream and keep the URL's page segment in sync.
  override(DiscussionPage.prototype, 'view', function (this: any, original) {
    if (!enabled()) return original();

    const self = this;

    this.pageChanged = function (pageNumber: number): void {
      const discussion = self.discussion;
      if (!discussion) return;

      const url = app.route.discussion(discussion, (self.near = pageNumber));
      window.history.replaceState(null, document.title, url);
      app.history.push('discussion', discussion.title());
    };

    this.mainContent = function (this: any): ItemList<Mithril.Children> {
      const items = new ItemList<Mithril.Children>();
      items.add('sidebar', this.sidebar(), 100);
      items.add(
        'poststream',
        <div className="DiscussionPage-stream">
          <PostStreamPaginated discussion={this.discussion} stream={this.stream} onPositionChange={() => {}} onPageChange={this.pageChanged.bind(this)} />
        </div>,
        10
      );

      return items;
    };

    return original();
  });
}
