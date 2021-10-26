import compose from 'ramda/es/compose.js';
import cs from 'classnames-es';
import { fromEvent } from 'most/src/source/fromEvent.js';
import { LitElement, html } from 'lit-element';

import { Actions as actionsFactory } from '../molecules/actions.js';
import {
  debug as Debug,
  isAggregatedBy,
  isAggregatedByDate,
  isAggregatedByExceptValue,
} from '../utils/index.js';
import { actionImages, actionTexts } from '../atoms/action.js';
import { maybeSeparator } from '../atoms/separator.js';
import { observeC as observe, debounceC as debounce, skipC as skip } from '../utils/most.js';
import { RichMessageFactory } from '../domain/rich-message-factory.js';
import { style as actionsStyle } from '../molecules/actions.css.js';
import { style as separatorStyle } from '../atoms/separator.css.js';
import { VirtualList } from '../utils/virtual-list.js';
import { withStyle } from '../mixins/with-style.js';

import { wasAtHeadSym } from './scrollable.js';
import { style } from './messages.css.js';
import { style as styleExt } from './messages-extended.css.js';

const debug = Debug('@ulms/wc-chat/MessagesElement');

const showPosHelpers = element =>
  element && typeof element[wasAtHeadSym] !== 'undefined' && !element[wasAtHeadSym];

const actionsSym = Symbol('actions');
const reactionsSym = Symbol('reactions');

const relativeShiftTop = (anc, desc) => {
  const { top: ancTop } = anc.getBoundingClientRect();
  const { top: descTop } = desc.getBoundingClientRect();

  return ancTop - descTop;
};

const heightMatches = (a, b, delta = 1) => Math.abs(a - b) <= delta;
// due to decimal height we match height which differs by 1 at max

export class _MessagesElement extends LitElement {
  static get properties() {
    return {
      aggregateperinterval: String,
      classname: String,
      disablevl: { type: Boolean },
      forceUpdate: { type: Boolean },
      invoke: String,
      list: { type: Array },
      visiblelist: { type: Array },
      pagesize: { type: Number },
      parser: String,
      parserengine: { type: Object },
      parserpreset: String,
      parserrules: String,
      user: String,
      users: { type: Array },
      actions: { type: Array },
      i18n: { type: Object },
      lastseen: String,
      reactions: { type: Array },
    };
  }

  constructor(...argv) {
    super(...argv);

    this.visiblelist = [];
    this.forceUpdate = false;

    this.__afterRenderFn = undefined;
    this.__vlist = new VirtualList({ size: this.pagesize });
    this.__vlist.onUpdate(this.__handleVirtualListUpdate.bind(this));
    this.__applyForceUpdate = false;
    this.__memoForceUpdateToNextRender = false;
    this.__registeredUserInteraction = false;
    // is needed to toggle auto-scroll feature

    this.__visibleLength = undefined;

    this.i18n = {};

    this[actionsSym] = new Map();
    this[reactionsSym] = new Map();
  }

  get _actions() {
    return this[actionsSym];
  }

  set _actions(_) {
    this[actionsSym] = new Map(Array.isArray(_) ? _ : []);
  }

  get _factory() {
    return this.__messageFactory;
  }

  set _factory(a) {
    this.__messageFactory = a;
  }

  get _reactions() {
    return this[reactionsSym];
  }

  set _reactions(_) {
    this[reactionsSym] = new Map(Array.isArray(_) ? _ : []);
  }

  get _rootNode() {
    return this.shadowRoot && this.shadowRoot.children.length
      ? this.shadowRoot.children[0]
      : undefined;
  }

  get _parentEl() {
    return this.parentElement;
  }

  __handleVirtualListUpdate(next, prev) {
    let shouldUpdate = false;

    const invokeUpdate = n => {
      requestAnimationFrame(() => {
        shouldUpdate = false;

        this.visiblelist = n;
      });
    };

    if (next.length !== prev.length) {
      const rootHeight = this._rootNode.offsetHeight;
      const outerHeight = this._parentEl.offsetHeight;

      const relativeHeight = relativeShiftTop(this._parentEl, this._rootNode);

      const isEdgeReached = rootHeight <= relativeHeight + outerHeight;

      if (isEdgeReached) shouldUpdate = true;
    }

    shouldUpdate && invokeUpdate(next, prev);
  }

  __getTailHeight() {
    const relativeHeight = relativeShiftTop(this._parentEl, this._rootNode);
    const tailHeight = this._rootNode.offsetHeight - relativeHeight;

    return tailHeight;
  }

  __getInstantTailHeight() {
    const scrollableCont = this._parentEl._scrollable;
    const tailHeight = scrollableCont.scrollTop;

    return tailHeight;
  }

  // eslint-disable-next-line class-methods-use-this
  __predictNavigationDirection(prev = [], next = []) {
    const pl = prev.length;
    const nl = next.length;

    if (pl > nl) return -1;
    if (pl < nl) return 1;

    return 0;
  }

  __updateList() {
    this.__vlist.list = this.list;

    const nextList = this.__vlist.list;

    this.visiblelist = this.__applyForceUpdate ? this.list : nextList;
  }

  connectedCallback() {
    super.connectedCallback();

    const seek$ = fromEvent('seek', this.parentElement);
    const seekBefore$ = fromEvent('seek-before', this.parentElement);

    let userScroll$;

    if (this.parentElement.shadowRoot) {
      userScroll$ = fromEvent('scroll', this.parentElement.shadowRoot, true);
    }

    compose(
      observe(() => {
        const activeitems = this.__discoverMessageVisibility();

        if (this.__vlist) {
          this.__vlist.adjust(activeitems);
        } else {
          debug('Can not adjust.List is absent');
        }
      }),
      debounce(50),
    )(seek$);

    compose(
      observe(() => {
        if (this._rootNode) {
          const currentHeight = this._rootNode.offsetHeight;

          // save fn to perform scroll updating to previous position
          this.__afterRenderFn = next => {
            const presentHeight = this._rootNode.offsetHeight;

            if (presentHeight === this._rootNode.offsetHeight && !presentHeight) return undefined;

            const nextHeight = presentHeight - currentHeight;

            if (next && next.top === false && nextHeight === 0) {
              return undefined;
            }

            if (presentHeight - currentHeight < 0) {
              return [0, 1e6];
              // scroll to end on drastically change
            }

            return [0, presentHeight - currentHeight];
          };
        }
      }),
    )(seekBefore$);

    userScroll$ &&
      compose(
        observe(() => {
          if (!this.__registeredUserInteraction) this.__registeredUserInteraction = true;

          if (this.__getTailHeight() - this._parentEl.scrollHeight <= 100) {
            this.__onEdge = true;
          } else {
            this.__onEdge = false;
          }
        }),
        skip(1),
      )(userScroll$);

    this.__initFactory();
  }

  firstUpdated() {
    const { actions = [], reactions = [] } = this;

    this._actions = actions;
    this._reactions = reactions;

    // eslint-disable-next-line no-unused-expressions
    Array.isArray(reactions) &&
      reactions.forEach(it => {
        this[reactionsSym].set(it[0], { name: `:${it[0]}:`, count: it[1] || 0 });
      });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.__vlist = undefined;
    this.__registeredUserInteraction = false;

    this._factory.destroy();
    this._factory = undefined;

    this[actionsSym] = undefined;
    this[reactionsSym] = undefined;
  }

  shouldUpdate(changedProps) {
    if (changedProps.has('parserengine')) this.__initFactory();

    if (changedProps.has('pagesize') && this.__vlist) this.__vlist.size = Number(this.pagesize);
    // update page size from props

    if (changedProps.has('list') && this._rootNode && this.__vlist) {
      this.__updateList();
    }

    if (changedProps.has('visiblelist') && this._rootNode) {
      const relativeHeight = relativeShiftTop(this._parentEl, this._rootNode);

      this.__tailHeight = this.__getTailHeight();
      if (this.__tailHeight && !relativeHeight) {
        this.requestUpdate('__tailHeight', this.__tailHeight);
      }
    }

    if (changedProps.has('disablevl')) {
      if (this.disablevl) {
        this.__vlist.disabled = true;
      } else {
        this.__vlist.disabled = false;
      }
    }

    return super.shouldUpdate(changedProps);
  }

  async _performUpdate() {
    await new Promise(resolve => requestAnimationFrame(() => resolve()));

    if (this.__vlist) {
      this.__vlist.filterVisible();
      const updatedList = this.__vlist.list; // eslint-disable-line no-unused-vars
      // update virtual list on update
    } else {
      debug('Can not access vlist');
    }

    super.performUpdate();
  }

  update(changed) {
    const initialRender = !this._rootNode;

    if (changed.has('list') && initialRender) {
      this.visiblelist = this.list;
      this.__vlist.list = this.list;
    }

    if (changed.has('forceUpdate') && this.forceUpdate) {
      this.__applyForceUpdate = this.forceUpdate;
    }

    this.onUpdate(changed);

    super.update(changed);
  }

  render() {
    const { list = [] } = this;

    if (this._parentEl && this._rootNode) {
      if (!this.__prevWasAtTop) {
        this.__prevWasAtTop = this._parentEl.scrollTop === 0;
      }
      if (!this.__prevWasAtBottom) {
        this.__prevWasAtBottom =
          this._parentEl.scrollHeight - this._parentEl.scrollTop === this._rootNode.offsetHeight;
      }
    }

    if (!list.length)
      return html`
        <div class="messages"></div>
      `;

    return html`
      <div class="messages">
        <div class="messages-inner">
          ${this.__renderMessages(this.visiblelist)}
        </div>
      </div>
    `;
  }

  onUpdate() {
    this.updateComplete
      .then(result => {
        if (this.__memoForceUpdateToNextRender) {
          this.__memoForceUpdateToNextRender = false;

          requestAnimationFrame(() => {
            this._parentEl.scrollTo(0, 1e6);
            // scroll to the latest element on force update
          });
        }

        if (this.__applyForceUpdate) {
          this.__memoForceUpdateToNextRender = true;
          this.__applyForceUpdate = false;
        }

        return result;
      })
      .catch(console.error); // eslint-disable-line no-console
  }

  __viewportIsOnEdges() {
    const scrollableCont = this._parentEl._scrollable;

    const onTop = scrollableCont.scrollTop === 0;
    const atBottom =
      scrollableCont.scrollTop + scrollableCont.offsetHeight === scrollableCont.scrollHeight;

    const messages = this.__checkMessagesVisibility();
    const latestMessageIsVisible = messages.length && messages[messages.length - 1].visible;

    return onTop || atBottom || latestMessageIsVisible;
  }

  updated(changed) {
    super.updated(changed);

    const listWasChanged = changed.has('list');
    const scrollableCont = this._parentEl._scrollable;

    return this.updateComplete
      .then(result => {
        this.__curIsAtTop = scrollableCont.scrollTop === 0;
        this.__curIsAtBottom = heightMatches(
          scrollableCont.scrollHeight - scrollableCont.scrollTop,
          scrollableCont.offsetHeight,
        );

        if (!result) {
          return new Error('Could not perform the update. Nested changing was detected');
        }

        let nextScrollPos;

        const isOnTop = () => this._rootNode.offsetHeight === this.__tailHeight;

        if (this.__registeredUserInteraction && !this.__viewportIsOnEdges()) {
          nextScrollPos = [0, scrollableCont.scrollTop];
        } else if (!listWasChanged && typeof this.__tailHeight !== 'undefined') {
          if (!this.__registeredUserInteraction) {
            nextScrollPos = [0, this._rootNode.offsetHeight];
          }
        } else if (listWasChanged) {
          const visibleEls = this.__discoverMessageVisibility();

          this.__vlist && this.__vlist.adjust(visibleEls);

          const listLengthChanged = changed.get('list').length !== this.list.length;
          const lastIsByUser = this.list[this.list.length - 1].created_by === this.user;

          if (!this.__registeredUserInteraction) {
            nextScrollPos = [0, this.__tailHeight + this._rootNode.offsetHeight];
          } else if (listLengthChanged && lastIsByUser) {
            if (this.__onEdge) {
              nextScrollPos = [0, 1e6];
            } else {
              nextScrollPos = [0, this._rootNode.offsetHeight - this.__tailHeight];
            }
          } else if (listLengthChanged) {
            if (this.__onEdge) {
              nextScrollPos = [0, 1e6];
            } else {
              nextScrollPos = [0, this._rootNode.offsetHeight - this.__tailHeight];
            }
          } else if (this.__afterRenderFn) {
            const onTop = isOnTop();

            if (!onTop) {
              nextScrollPos = this.__afterRenderFn({ top: onTop });
            }
            this.__afterRenderFn = undefined;
          } else if (!this.__afterRenderFn && !this.__registeredUserInteraction) {
            nextScrollPos = [0, this._rootNode.offsetHeight];
          } else if (
            !this.__afterRenderFn &&
            changed.get('list').length !== this.list.length &&
            this.__prevWasAtBottom &&
            !this.__prevWasAtBottom
          ) {
            nextScrollPos = [0, 1e6];
          }
        }

        if (nextScrollPos.length) {
          this._parentEl.scrollTo(...nextScrollPos);
          this.__lastScrollPos = nextScrollPos;
          nextScrollPos = undefined;
        }

        this.__prevWasAtBottom = this.__curIsAtBottom;
        this.__prevWasAtTop = this.__curIsAtTop;

        debug('Element was updated');

        return result;
      })
      .catch(error => debug(error.message));
  }

  __initFactory() {
    if (this._factory) this._factory.destroy();

    this._factory = new RichMessageFactory({
      parserengine: this.parserengine,
      parser: this.parser,
      parserpreset: this.parserpreset,
      parserrules: this.parserrules,
    });
  }

  __outputTplAccordingParentPosition() {
    return showPosHelpers(this.parentElement);
  }

  __renderMessages(list) {
    const { lastseen: ls, user, users } = this;
    let lastseen;

    const nextList = list.map(a => {
      const _user = users[users.findIndex(b => b.user_id === a.created_by)];
      let is_lastseen = false;

      if (!_user) return a;

      const { image, display_name } = _user;

      if (lastseen && String(a.user_id) !== user) {
        is_lastseen = true;
        lastseen = false;
      }

      if (typeof lastseen === 'undefined' && a.id === ls) lastseen = a.id;

      return {
        ...a,
        avatar: image,
        user_name: display_name,
        username: display_name,
        lastseen: is_lastseen,
        pinned: a.attribute === 'pinned',
      };
    });

    return nextList.map((it, i, arr) => this.__renderEach(it, i, arr));
  }

  __renderEach(it, i, arr) {
    return this.__renderMessage(this.__hydrateEach(it, i, arr));
  }

  __hydrateEach(it, i, arr) {
    const { user, aggregateperinterval } = this;
    const {
      avatar,
      body, // .body should be depracated later on
      classname,
      deleted,
      icon,
      id,
      identity,
      invisible,
      lastseen,
      pinned,
      rating,
      text,
      theme,
      timestamp,
      user_id,
      user_name,
      visible,
    } = it;

    const { body: messageText, unsafe } =
      this._factory && this._factory.make
        ? this._factory.make({ body: body || text })
        : { body: body || text, unsafe: false };

    return {
      aggregated:
        isAggregatedBy('user_id', i, arr) &&
        isAggregatedByDate(
          'timestamp',
          i,
          arr,
          aggregateperinterval ? Number(aggregateperinterval) : undefined,
        ) &&
        isAggregatedByExceptValue('attribute', i, arr),
      avatar,
      classname,
      deleted,
      icon,
      id,
      identity,
      invisible,
      is_lastseen: lastseen,
      me: user === String(user_id),
      pinned,
      rating,
      text: messageText,
      theme,
      timestamp,
      unsafe,
      user_icon: icon,
      user_id,
      user_name,
      visible,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  __renderMessage(message) {
    const {
      aggregated,
      avatar,
      classname,
      deleted,
      icon,
      id,
      identity,
      invisible,
      is_lastseen,
      me,
      pinned,
      rating,
      text,
      theme,
      timestamp,
      unsafe,
      user_name,
    } = message;

    const className = cs({
      [classname]: classname,
      aggregated,
      message: true,
      unseen: is_lastseen,
    });

    if (invisible) return undefined;
    // skip unless visible

    const actionsHtml = this.__renderActions(message);
    const reactionsHtml = this.__renderReactions({ rating, text });

    if (pinned) {
      return html`
        <wc-chat-message
          .aggregated=${aggregated}
          .identity=${identity}
          .parser=${this.parser}
          .unsafe=${unsafe}
          ?deleted=${deleted}
          ?me=${me}
          class=${className}
          icon=${icon || ''}
          image=${avatar}
          pinned
          text=${text}
          theme=${theme || ''}
          timestamp=${timestamp}
          uid=${id}
          username=${user_name}
        >
          <div slot="message-prologue">
            ${actionsHtml}
          </div>
          <div slot="message-epilogue">
            ${reactionsHtml}
          </div>
        </wc-chat-message>
      `;
    }

    const separatorHtml = maybeSeparator({
      id,
      text: this.i18n.NEW_MESSAGES,
      enabled: is_lastseen && this.__outputTplAccordingParentPosition(), // show chunks according the parentElement
    });

    return html`
      <wc-chat-message
        .aggregated=${aggregated}
        .identity=${identity}
        .parser=${this.parser}
        .unsafe=${unsafe}
        ?deleted=${deleted}
        ?me=${me}
        class=${className}
        icon=${icon || ''}
        image=${avatar}
        text=${text}
        theme=${theme || ''}
        timestamp=${timestamp}
        uid=${id}
        username=${user_name}
      >
        ${separatorHtml}
        <div slot="message-prologue">
          ${actionsHtml}
        </div>
        <div slot="message-epilogue">
          ${reactionsHtml}
        </div>
      </wc-chat-message>
    `;
  }

  __checkMessagesVisibility() {
    const parentEl = this.parentElement;
    const childrenEls = this.shadowRoot.querySelector('.messages-inner').children;

    const { top, bottom } = parentEl.getBoundingClientRect();

    const listVisibility = [...childrenEls].map(el => {
      const { top: elTop, bottom: elBot } = el.getBoundingClientRect();

      const elTopR = Math.round(elTop);
      const elBotR = Math.round(elBot);
      const topR = Math.round(top);
      const bottomR = Math.round(bottom);

      return {
        id: el.uid,
        visible: topR <= elTopR && elTopR <= bottomR && (topR <= elBotR && elBotR <= bottomR),
      };
    });

    return listVisibility;
  }

  __discoverMessageVisibility() {
    const listVisibility = this.__checkMessagesVisibility();

    const visibleMessages = listVisibility.filter(a => a.visible === true).map(a => a.id);

    this.__visibleLength = visibleMessages.length;

    const [firstVisibleId] = visibleMessages;
    const [firstStored] = this.list;

    const shouldDispatchTopReached =
      firstStored && firstVisibleId && firstStored.id === firstVisibleId;

    this.dispatchEvent(
      new CustomEvent('viewport-list-change', { detail: { length: visibleMessages.length } }),
    );

    if (shouldDispatchTopReached) {
      this.dispatchEvent(new CustomEvent('reached-before', { detail: { id: firstVisibleId } }));
    }

    return visibleMessages;
  }

  __renderActions(data) {
    const actions = new Map();
    const reactions = new Map();

    this._actions = this.actions;

    const isAllowed4Other = (a, b) =>
      // eslint-disable-next-line no-bitwise,max-len
      !b.me && Boolean(a & 1);
    const isAllowed4Group = (a, b) =>
      // eslint-disable-next-line no-bitwise,max-len
      !b.me && Boolean(a & 10);
    const isAllowed4Self = (a, b) =>
      // eslint-disable-next-line no-bitwise,max-len
      b.me && Boolean(a & 100);

    const isAllowed = (a, b) =>
      isAllowed4Other(a, b) || isAllowed4Group(a, b) || isAllowed4Self(a, b);

    // eslint-disable-next-line no-unused-expressions
    Array.isArray(this.actions) &&
      this.actions.forEach(_ => {
        const key = _[0];
        const _action =
          key && this._actions && this._actions.has(key) ? this._actions.get(key) || 0 : 0;

        if (!isAllowed(_action, data)) {
          debug('Action is not allowed');

          return;
        }

        if (data.pinned && key === 'message-pin') return;
        if (!data.pinned && key === 'message-unpin') return;

        const actionOpts = {
          message: data,
          children: actionImages.get(key),
          text: this.i18n[actionTexts.get(key)],
          handler: (e, detail) => {
            this.dispatchEvent(new CustomEvent(key, { detail }));
          },
        };

        if (key === 'message-reaction') {
          reactions.set(key, actionOpts);
        } else {
          actions.set(key, actionOpts);
        }
      });

    return actionsFactory({ actions, reactions });
  }

  // eslint-disable-next-line class-methods-use-this
  __renderReactions(opts) {
    const { rating } = opts;
    let config;

    if (typeof rating === 'number') {
      config = new Map([['thumbsup', { name: ':thumbsup:', count: rating }]]);
    } else if (Array.isArray(rating)) {
      config = new Map([]);
      rating.forEach(it => {
        config.set(it[0], { name: `:${it[0]}:`, count: it[1] || 0 });
      });
    } else if (opts.rating !== undefined) {
      throw new TypeError('Wrong rating type');
    }

    return !config
      ? undefined
      : html`
          <wc-chat-reactions ?showcount=${true} .config=${config} />
        `;
  }
}

export const MessagesElement = withStyle()(
  _MessagesElement,
  style,
  separatorStyle,
  actionsStyle,
  styleExt,
);
