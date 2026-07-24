import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import extractText from 'flarum/common/utils/extractText';
import type Mithril from 'mithril';

/**
 * The pager rendered under (and/or above) the discussion list. Ported from
 * FoskyM/flarum-pagination (MIT); the previously hard-coded English button
 * labels are now translation keys so the pager localises (e.g. Macedonian).
 */
export default class Toolbar extends Component {
  attrs: any;

  view(vnode: Mithril.Vnode) {
    let state = this.attrs.state;
    return (
      <div className="Pagination">
        <ul class="IndexPage-toolbar-view">
          <li>{this.buttonFirst()}</li>
          <li>{this.buttonBack()}</li>
          {state.ctrl.pageList().map((page: any) => {
            return (
              <li>
                <Button
                  title={page}
                  className={state.page().number == page ? 'Button Button--primary Button--active' : 'Button'}
                  onclick={() => {
                    state.ctrl.toPage(page);
                  }}
                >
                  {page}
                </Button>
              </li>
            );
          })}
          <li>{this.buttonNext()}</li>
          <li>{this.buttonLast()}</li>
          <li>{this.inputJump()}</li>
          <li>{this.buttonJump()}</li>
        </ul>
      </div>
    );
  }

  buttonFirst() {
    let state = this.attrs.state;
    return Button.component({
      title: app.translator.trans('gradba-pagination.forum.list.first'),
      icon: 'fas fa-angles-left',
      className: 'Button Button--icon',
      onclick: () => {
        state.ctrl.toPage(1);
      },
      disabled: state.page().number == 1,
    });
  }

  buttonBack() {
    let state = this.attrs.state;
    return Button.component({
      title: app.translator.trans('gradba-pagination.forum.list.previous'),
      icon: 'fas fa-angle-left',
      className: 'Button Button--icon',
      onclick: () => {
        let page = state.page().number;
        state.ctrl.toPage(parseInt(page) - 1);
      },
      disabled: state.page().number == 1,
    });
  }

  buttonNext() {
    let state = this.attrs.state;
    return Button.component({
      title: app.translator.trans('gradba-pagination.forum.list.next'),
      icon: 'fas fa-angle-right',
      className: 'Button Button--icon',
      onclick: () => {
        let page = state.page().number;
        state.ctrl.toPage(parseInt(page) + 1);
      },
      disabled: state.page().number == state.totalPages(),
    });
  }

  buttonLast() {
    let state = this.attrs.state;
    return Button.component({
      title: app.translator.trans('gradba-pagination.forum.list.last'),
      icon: 'fas fa-angles-right',
      className: 'Button Button--icon',
      onclick: () => {
        let page = parseInt(state.totalPages());
        state.ctrl.toPage(page);
      },
      disabled: state.page().number == state.totalPages(),
    });
  }

  JumpFunc() {
    let state = this.attrs.state;
    let input = parseInt((document.getElementById('pagination-inputJump') as HTMLInputElement)?.value);
    if (Number.isFinite(input) && Number.isSafeInteger(input)) {
      if (input != state.page().number) {
        if (1 <= input && input <= state.totalPages()) {
          state.ctrl.toPage(input);
        }
      }
    }
  }

  inputJump() {
    let state = this.attrs.state;
    return m('input.FormControl', {
      id: 'pagination-inputJump',
      placeholder: state.page().number === undefined ? '' : `${state.page().number}`,
      title: extractText(app.translator.trans('gradba-pagination.forum.list.jump')),
      onkeydown: (event: any) => {
        event.redraw = false;
        if (event.keyCode == 13) {
          event.redraw = true;
          this.JumpFunc();
        }
      },
    });
  }

  buttonJump() {
    return Button.component({
      title: app.translator.trans('gradba-pagination.forum.list.jump'),
      icon: 'fas fa-paper-plane',
      className: 'Button Button--icon',
      onclick: this.JumpFunc.bind(this),
    });
  }
}
