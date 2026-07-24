import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import SettingsPage from 'flarum/forum/components/SettingsPage';
import FieldSet from 'flarum/common/components/FieldSet';
import ItemList from 'flarum/common/utils/ItemList';
import Switch from 'flarum/common/components/Switch';
import Stream from 'flarum/common/utils/Stream';

/**
 * Adds a per-user "pagination vs load-more" preference to the account settings
 * page (only shown when the admin has allowed it). Ported from
 * FoskyM/flarum-pagination (MIT), keys renamed.
 */
export default function addUserPreference() {
  extend(SettingsPage.prototype, 'oninit', function (this: any) {
    const user = this.user;
    const preferences = user.preferences();
    this.userCustom = Stream(preferences['gradba-pagination.userCustom']);
    this.userPaginationOnLoading = Stream(preferences['gradba-pagination.userPaginationOnLoading']);
  });

  extend(SettingsPage.prototype, 'settingsItems', function (this: any, items) {
    if (Boolean(app.forum.attribute('gradba-pagination.canUserPref'))) {
      items.add(
        'gradba_pagination_settings',
        FieldSet.component(
          {
            label: app.translator.trans('gradba-pagination.forum.user.settings.head'),
            className: 'SettingsPage-pagination',
          },
          this.Pagination_UserPrefItems().toArray()
        )
      );
    }
  });

  (SettingsPage.prototype as any)['Pagination_UserPrefItems'] = function (this: any) {
    const items = new ItemList();
    items.add(
      'gradba-pagination.userCustom',
      Switch.component(
        {
          state: this.user.preferences()['gradba-pagination.userCustom'],
          onchange: (value: boolean) => {
            this.UserCustom_Loading = true;
            this.user.savePreferences({ 'gradba-pagination.userCustom': value }).then(() => {
              this.UserCustom_Loading = false;
              m.redraw();
            });
          },
          loading: this.UserCustom_Loading,
        },
        app.translator.trans('gradba-pagination.forum.user.settings.userCustom')
      )
    );

    if (this.user.preferences()['gradba-pagination.userCustom']) {
      items.add(
        'gradba-pagination.userPaginationOnLoading',
        Switch.component(
          {
            state: this.user.preferences()['gradba-pagination.userPaginationOnLoading'],
            onchange: (value: boolean) => {
              this.userPaginationOnLoading_Loading = true;
              this.user.savePreferences({ 'gradba-pagination.userPaginationOnLoading': value }).then(() => {
                this.userPaginationOnLoading_Loading = false;
                m.redraw();
              });
            },
            loading: this.userPaginationOnLoading_Loading,
          },
          app.translator.trans('gradba-pagination.forum.user.settings.userPaginationOnLoading')
        )
      );
    }

    return items;
  };
}
