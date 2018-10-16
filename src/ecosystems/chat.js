import { html, LitElement } from '@polymer/lit-element'
import { withStyle } from '@netology-group/wc-utils/lib/mixins/mixins'
import { ReactionList as Reactions } from '@netology-group/wc-reaction/es/organisms/reaction-list'

import Input from '../organisms/input'
import Messages from '../organisms/messages-extended'
import Scroll from '../molecules/scrollable'
import { registerCustomElement } from '../utils/index'
import style from '../ecosystems/chat.css'

const EVENT = 'did-update'

export class Chat extends LitElement {
  static get properties () {
    return {
      actions: Array,
      actionsallowed: Array,
      delay: Number,
      disabled: Boolean,
      list: Array,
      maxrows: Number,
      message: String,
      noinput: Boolean,
      placeholder: String,
      placeholderdisabled: String,
      reverse: Boolean,
      user: Number,
      users: Array,
    }
  }

  constructor (props) {
    super(props)

    this.boundedMessageSubmit = this._handleSubmit.bind(this)
    this.boundedMessageDelete = this._handleDelete.bind(this)
    this.boundedUserDisable = this._handleUserDisable.bind(this)
    this.boundedMessageReaction = this._handleMessageReaction.bind(this)

    registerCustomElement('wc-chat-scrollable', Scroll)
    registerCustomElement('wc-chat-input', Input)
    registerCustomElement('wc-chat-messages', Messages)
    registerCustomElement('wc-chat-reactions', Reactions)

    this._scrollable = null
  }

  disconnectedCallback () {
    this.boundedMessageSubmit = null
    this.boundedMessageDelete = null
    this.boundedUserDisable = null
    this.boundedMessageReaction = null
  }

  scrollTo () {
    this._scrollable.scrollTo && this._scrollable.scrollTo()
  }

  _firstRendered () {
    if (this.shadowRoot) this._scrollable = this.shadowRoot.querySelector('wc-chat-scrollable')
  }

  _handleSubmit (e) {
    this.dispatchEvent(new CustomEvent('chat-message-submit', { detail: e.detail }))
  }

  _handleDelete (e) {
    this.dispatchEvent(new CustomEvent('chat-message-delete', { detail: e.detail }))
  }

  _handleUserDisable (e) {
    this.dispatchEvent(new CustomEvent('chat-user-disable', { detail: e.detail }))
  }

  _handleMessageReaction (e) {
    this.dispatchEvent(new CustomEvent('chat-message-reaction', { detail: e.detail }))
  }

  _render (props) {
    const input = props.noinput
      ? null
      : (html`
        <div class='input'>
          <wc-chat-input
            delay='${props.delay || 0}'
            maxrows='${props.maxrows || 10}'
            disabled='${props.disabled}'
            on-message-submit='${this.boundedMessageSubmit}'
            placeholder='${props.placeholder}'
            placeholderdisabled='${props.placeholderdisabled}'
            value='${props.message}'
          />
        </div>
      `)

    return (html`
      <div class='wrapper'>
        <wc-chat-scrollable
          reverse='${props.reverse}'
          listen='${EVENT}'
        >
          <wc-chat-messages
            actions='${props.actions}'
            actionsallowed='${props.actionsallowed}'
            invoke='${EVENT}'
            list='${props.list}'
            on-message-delete='${this.boundedMessageDelete}'
            on-message-reaction='${this.boundedMessageReaction}'
            on-user-disable='${this.boundedUserDisable}'
            user='${props.user}'
            users='${props.users}'
          />
        </wc-chat-scrollable>
        ${input}
      </div>
    `)
  }
}

export default withStyle(html)(Chat, style)
