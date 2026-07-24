import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import DiscussionComposer from 'flarum/forum/components/DiscussionComposer';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';

import addUserPreference from './list/addUserPreference';
import overrideDiscussionListState from './list/overrideDiscussionListState';
import overrideDiscussionList from './list/overrideDiscussionList';
import { listEnabled } from './list/determineMode';
import overrideDiscussionPage from './stream/overrideDiscussionPage';

app.initializers.add(
  'gradba-pagination',
  () => {
    // --- Discussion-list pagination -------------------------------------
    addUserPreference();
    overrideDiscussionListState();
    overrideDiscussionList();

    extend(DiscussionControls, 'deleteAction', function (this: any) {
      if (!listEnabled() || !this.usePaginationMode) return;
      if (app.discussions) {
        const page = app.discussions.location.page;
        app.discussions.refresh(page);
      }
    });

    extend(DiscussionComposer.prototype, 'onsubmit', function (this: any) {
      if (!listEnabled() || !this.usePaginationMode) return;
      if (app.discussions) {
        app.discussions.refresh();
      }
    });

    // --- Post-stream pagination -----------------------------------------
    overrideDiscussionPage();
  },
  // Load late so we cooperate with other discussion-list extensions.
  -2
);
