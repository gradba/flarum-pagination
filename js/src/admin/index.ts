import app from 'flarum/admin/app';

const t = (key: string) => app.translator.trans('gradba-pagination.admin.settings.' + key);

app.initializers.add('gradba-pagination', () => {
  app.extensionData
    .for('gradba-pagination')

    // --- Master switches ---------------------------------------------------
    .registerSetting({
      label: t('enableDiscussionList'),
      help: t('enableDiscussionList-Help'),
      setting: 'gradba-pagination.enableDiscussionList',
      type: 'boolean',
    })
    .registerSetting({
      label: t('enablePostStream'),
      help: t('enablePostStream-Help'),
      setting: 'gradba-pagination.enablePostStream',
      type: 'boolean',
    })

    // --- Post stream (inside a discussion) --------------------------------
    .registerSetting({
      label: t('postsPerPage'),
      help: t('postsPerPage-Help'),
      setting: 'gradba-pagination.postsPerPage',
      type: 'number',
      min: 1,
      max: 50,
    })
    .registerSetting({
      label: t('postStreamPosition'),
      setting: 'gradba-pagination.postStreamPosition',
      type: 'select',
      options: {
        above: t('position.above'),
        under: t('position.under'),
        both: t('position.both'),
      },
      default: 'both',
    })

    // --- Discussion list ---------------------------------------------------
    .registerSetting({
      label: t('perPage'),
      help: t('perPage-Help'),
      setting: 'gradba-pagination.perPage',
      type: 'number',
      min: 1,
      max: 50,
    })
    .registerSetting({
      label: t('canUserPref'),
      help: t('canUserPref-Help'),
      setting: 'gradba-pagination.canUserPref',
      type: 'boolean',
    })
    .registerSetting({
      label: t('paginationOnLoading'),
      help: t('paginationOnLoading-Help'),
      setting: 'gradba-pagination.paginationOnLoading',
      type: 'boolean',
    })
    .registerSetting({
      label: t('cacheDiscussions'),
      help: t('cacheDiscussions-Help'),
      setting: 'gradba-pagination.cacheDiscussions',
      type: 'boolean',
    })
    .registerSetting({
      label: t('paginationPosition'),
      setting: 'gradba-pagination.paginationPosition',
      type: 'select',
      options: {
        above: t('position.above'),
        under: t('position.under'),
        both: t('position.both'),
      },
      default: 'under',
    })
    .registerSetting({
      label: t('perIndexInit'),
      help: t('perIndexInit-Help'),
      setting: 'gradba-pagination.perIndexInit',
      type: 'number',
      min: 1,
      max: 50,
    })
    .registerSetting({
      label: t('perLoadMore'),
      help: t('perLoadMore-Help'),
      setting: 'gradba-pagination.perLoadMore',
      type: 'number',
      min: 1,
      max: 50,
    });
});
