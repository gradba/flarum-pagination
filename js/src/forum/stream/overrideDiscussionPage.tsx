import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import CommentPost from 'flarum/forum/components/CommentPost';
import PostStreamState from 'flarum/forum/states/PostStreamState';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';

import PostStreamPaginated from './PostStreamPaginated';

function enabled(): boolean {
  return !!app.forum.attribute('gradba-pagination.enablePostStream');
}

function perPage(): number {
  return parseInt(app.forum.attribute('gradba-pagination.postsPerPage')) || 20;
}

/**
 * Turns the in-discussion post stream into a paginated one.
 *
 * We deliberately do NOT override DiscussionPage.show — core's own show sets up
 * the stream, positions it and (critically) drives all the redraw/lifecycle
 * plumbing. We only swap the rendered stream component for our paginated
 * subclass and remove the scrubber. Deep-links and read-state continue to use
 * core's native post-number positioning (via onPositionChange), so mention/flag
 * "jump to post" links keep working without any serializer changes.
 */
export default function overrideDiscussionPage() {
  // Align core's post-load window with the page size BEFORE core's show creates
  // the stream, so the initial deep-link load fetches ~one page instead of the
  // default 20-post window. Safe here (app.forum exists at oninit) — unlike the
  // app initializer body, which runs before forum data is attached.
  override(DiscussionPage.prototype, 'oninit', function (this: any, original, vnode) {
    if (enabled()) {
      (PostStreamState as any).loadCount = perPage();
    }
    return original(vnode);
  });

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

  // Render our paginated stream component in place of core PostStream.
  override(DiscussionPage.prototype, 'view', function (this: any, original) {
    if (!enabled()) return original();

    this.mainContent = function (this: any): ItemList<Mithril.Children> {
      const items = new ItemList<Mithril.Children>();
      items.add('sidebar', this.sidebar(), 100);
      items.add(
        'poststream',
        <div className="DiscussionPage-stream">
          <PostStreamPaginated
            discussion={this.discussion}
            stream={this.stream}
            onPositionChange={this.positionChanged.bind(this)}
          />
        </div>,
        10
      );

      return items;
    };

    return original();
  });
}
