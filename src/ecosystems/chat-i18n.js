import { html } from 'lit-element';

import { withStyle } from '../mixins/with-style.js';
import { slotSwitcher } from '../molecules/slot-switcher.js';
import { style as slotSwitcherStyle } from '../molecules/slot-switcher.css.js';
import i18n from '../i18n.js';

import { _ChatElement } from './chat.js';
import { style } from './chat.css.js';

const EVENT = 'did-update';
const i18nSym = Symbol('i18nengine');

const format = (Engine, i = {}, o = {}) => {
  if (!Engine) return i.message;

  const lexem = new Engine(i.message, i.language);

  return lexem && lexem.format ? lexem.format(o) : i.message;
};

export class _ChatI18NElement extends _ChatElement {
  static get properties() {
    return {
      actions: { type: Array },
      aggregateperinterval: String,
      connectedeventname: String,
      delayresize: { type: { type: Number } },
      delayscroll: { type: Number },
      delaysubmit: { type: Number },
      delayupdate: { type: Number },
      disabled: { type: Boolean },
      disablerecentbanner: { type: Number },
      disableunseenbanner: { type: Number },
      filters: { type: String },
      i18nengine: Function,
      language: String,
      lastseen: String,
      list: { type: Array },
      maxlength: { type: Number },
      maxrows: { type: Number },
      message: String,
      noinput: { type: Boolean },
      omni: { type: Boolean },
      pagesize: String,
      parser: String,
      parserengine: { type: Object },
      parserpreset: String,
      parserrules: String,
      placeholder: String,
      placeholderdisabled: String,
      preprocessors: String,
      quantity: { type: Number },
      ratelimit: { type: Number },
      reactions: { type: Array },
      scrollabledisabled: { type: Boolean },
      user: String,
      userbanned: { type: Boolean },
      users: { type: Array },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  get className() {
    return '_ChatI18NElement';
  }

  constructor() {
    super();

    this.delaysubmit = 0;
    this.list = [];
    this.message = '';
    this.pagesize = 15;
    this.quantity = 0;
    this.userbanned = false;

    this.__filtersActive = false;
    this.__filtersWereActive = false;
    this.__hasNoInput = null;
  }

  // eslint-disable-next-line class-methods-use-this
  get i18n() {
    return i18n;
  }

  // TODO: rewrite to lit-element property
  set I18nEngine(e) {
    this[i18nSym] = e;
  }

  get I18nEngine() {
    return this[i18nSym] || this.i18nengine;
  }

  connectedCallback() {
    super.connectedCallback();

    this.__hasNoInput = {
      disabled: this.disabled,
      disableunseenbanner: this.disableunseenbanner,
      noinput: this.noinput || false, // store info about initial input need
    };
  }

  shouldUpdate(changedProperties) {
    const filtersActive = this.__filtersActive;
    const hadNoInput = changedProperties.has('noinput') && changedProperties.get('noinput');

    // disable remote input change on active filters
    if (filtersActive && hadNoInput && !this.noinput) {
      this.noinput = true;
      this.__hasNoInput = this.noinput;

      return false;
    }

    if (!filtersActive && this.userbanned) {
      this.noinput = true;
      this.__hasNoInput = this.noinput;
    }

    return super.shouldUpdate(changedProperties);
  }

  updateFilters(filters) {
    const prevFilters = this.filters;

    if (filters !== prevFilters) {
      requestAnimationFrame(() => {
        this._handleFiltersChange();
      });
    }
  }

  _resolveLanguage(language) {
    let resolvedLanguage =
      !language &&
      this.I18nEngine &&
      this.I18nEngine.prototope &&
      this.I18nEngine.prototope._resolveLocale
        ? this.I18nEngine.prototype._resolveLocale(navigator.language)
        : language;

    if (!this.i18n[resolvedLanguage]) {
      resolvedLanguage = 'en-US';
    }

    return resolvedLanguage;
  }

  _handleFiltersChange() {
    const { disabled, disableunseenbanner, noinput } = this;

    const prevFitlersState = this.__filtersActive;
    const nextFitlersState = !prevFitlersState;

    this.__filtersWereActive = prevFitlersState;

    if (nextFitlersState) {
      this.filters = 'pinned=1';
      this.noinput = true;
      this.disableunseenbanner = 1;
      this.__hasNoInput = { disabled, disableunseenbanner, noinput };
    }

    if (!nextFitlersState) {
      if (this.__hasNoInput) {
        this.noinput = this.__hasNoInput.noinput;
        this.disabled = this.__hasNoInput.disabled;
        this.disableunseenbanner = this.__hasNoInput.disableunseenbanner;
      }
      this.filters = '';
    }

    this.__filtersActive = nextFitlersState;

    this.dispatchEvent(new CustomEvent('chat-filters-change', { detail: this.filters }));
  }

  render() {
    const {
      actions,
      aggregateperinterval,
      delayresize,
      delayscroll,
      delaysubmit,
      delayupdate,
      disabled,
      disablerecentbanner,
      disableunseenbanner,
      language,
      lastseen,
      list,
      maxlength,
      maxrows,
      message,
      noinput,
      omni,
      pagesize,
      parser,
      parserpreset,
      parserrules,
      placeholder,
      placeholderdisabled,
      preprocessors,
      quantity,
      reactions,
      scrollabledisabled,
      user,
      users,
    } = this;

    const currentLanguage = this._resolveLanguage(language);

    const {
      DELETE,
      GO_TO_RECENT_MESSAGE,
      NEW_MESSAGES_COUNT,
      NEW_MESSAGES,
      SEE,
      PIN_MESSAGES_COUNT,
    } = this.i18n[currentLanguage] || {};

    const lastSeenIndex =
      list && lastseen !== undefined ? list.findIndex(_ => _.id === lastseen) : undefined;
    // eslint-disable-next-line max-len
    const newMessageCount =
      list && lastseen !== undefined && lastSeenIndex !== undefined
        ? list.slice(lastSeenIndex + 1).filter(a => String(a.user_id) !== user).length
        : 0;

    const scrollableI18n = {
      GO_TO_RECENT_MESSAGE,
      NEW_MESSAGES_COUNT: format(
        this.I18nEngine,
        {
          message: NEW_MESSAGES_COUNT,
          language: currentLanguage,
        },
        { count: newMessageCount },
      ),
      SEE,
    };

    const messagesI18n = { DELETE, NEW_MESSAGES };

    const pinnedQnt = quantity;
    const pinnedText = format(
      this.I18nEngine,
      {
        message: PIN_MESSAGES_COUNT,
        language: currentLanguage,
      },
      {
        count: pinnedQnt,
      },
    );

    const shouldForceUpdate = this.__forceUpdate;

    /**
     *  Scrollable & messages are ment to work together
     */

    const filtersWereActive = this.__filtersWereActive;

    this.__filtersWereActive = false;

    return html`
      <div class="wrapper">
        ${slotSwitcher(pinnedQnt, pinnedText, this.__filtersActive, this._handleFiltersChange)}
        <wc-chat-scrollable
          ?disablerecentbanner=${Boolean(Number(disablerecentbanner))}
          ?disableunseenbanner=${Boolean(Number(disableunseenbanner))}
          ?freeze=${scrollabledisabled}
          ?omni=${omni}
          ?showbannernew=${newMessageCount > 0}
          .delay=${delayupdate}
          .delayresize=${delayresize}
          .delayscroll=${delayscroll}
          .i18n=${scrollableI18n}
          @last-seen-change=${this._handleLastSeenChange}
          @seek-after=${this._handleSeekAfter}
          @seek-before=${this._handleSeekBefore}
          listen=${EVENT}
          unseenSelector=".message.unseen"
        >
          <wc-chat-messages
            .actions=${actions}
            .aggregateperinterval=${aggregateperinterval}
            .disablevl=${filtersWereActive}
            .forceUpdate=${shouldForceUpdate}
            .i18n=${messagesI18n}
            .list=${list}
            .parserengine=${this.parserengine}
            .reactions=${reactions}
            .users=${users}
            @message-delete=${this._handleDelete}
            @message-pin=${this.__handleMessagePin}
            @message-reaction=${this._handleMessageReaction}
            @message-unpin=${this._handleMessageUnpin}
            @reached-before=${this._handleReachedBefore}
            @user-disable=${this._handleUserDisable}
            @viewport-list-change=${this._handleViewportChange}
            invoke=${EVENT}
            lastseen=${lastseen}
            pagesize=${pagesize}
            parser=${parser}
            parserrules=${parserrules}
            parserpreset=${parserpreset}
            user=${user}
          />
        </wc-chat-scrollable>
        ${noinput
          ? undefined
          : html`
              <div class="input">
                <wc-chat-input
                  ?disabled=${disabled}
                  .delay=${delaysubmit}
                  .maxlength=${maxlength}
                  .maxrows=${maxrows}
                  @message-submit=${this._handleSubmit}
                  placeholder=${placeholder}
                  placeholderdisabled=${placeholderdisabled}
                  preprocessors=${preprocessors}
                  timer=${this.__timer}
                  value=${message}
                />
              </div>
            `}
      </div>
    `;
  }
}

export const ChatI18NElement = withStyle()(_ChatI18NElement, style, slotSwitcherStyle);
