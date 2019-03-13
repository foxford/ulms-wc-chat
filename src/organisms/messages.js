import { html, classString as cs } from '@polymer/lit-element'
import { registerCustomElement } from '@netology-group/wc-utils/lib/utils'
import { withStyle } from '@netology-group/wc-utils'

import { XLitElement as LitElement } from '../utils/rendered-lit-element'

import { debug, isAggregatedBy } from '../utils/index'
import { style as actionStyle } from '../atoms/actions'
import { style as messageStyle, Message } from '../molecules/message'
import style from '../organisms/messages.css'

import { meta } from '../atoms/message'

export class MessagesElement extends LitElement {
  static get properties () {
    return {
      classname: String,
      invoke: String,
      lastseen: Number,
      list: Array,
      reverse: Boolean,
      user: Number,
      users: Array,
    }
  }

  connectedCallback () {
    if (!this.__setup) {
      debug('Registering customElements...')
      this._childrenElements.forEach((el, k) => { registerCustomElement(k, el) })
    }

    super.connectedCallback()
  }

  get _childrenElements () { // eslint-disable-line class-methods-use-this
    return new Map([['wc-message', Message]])
  }

  _renderMessage (message) { // eslint-disable-line class-methods-use-this
    const {
      aggregated,
      avatar,
      body,
      current_user_id,
      deleted,
      id,
      reversed,
      timestamp,
      user_id,
      user_name,
      user_role,
    } = message

    const metaTpl = aggregated
      ? undefined
      : meta({
        classname: user_role,
        display_role: user_role,
        timestamp,
        user_name,
      })

    const className = cs({
      aggregated,
      deleted,
      message: true,
      normal: !reversed,
      reversed,
    })

    return (html`
      <wc-message
        class$='${className}'
        aggregated='${aggregated}'
        body='${body}'
        classname='${user_role}'
        deleted='${deleted}'
        uid='${id}'
        image='${avatar}'
        me='${user_id === current_user_id}'
        reversed='${reversed}'
      >
        <div slot='message-prologue'>
          ${metaTpl}
        </div>
      </wc-message>
    `)
  }

  _renderEachMessage (it, i, arr) {
    const aggregated = isAggregatedBy('user_id', i, arr)
    const message = { ...it, current_user_id: this.user }

    const messageTpl = this._renderMessage({
      ...message,
      aggregated,
      reversed: this.reverse,
    })

    const className = cs({
      aggregated,
      deleted: message.deleted,
      [this.classname || 'messages-item']: true,
      normal: !this.reverse,
      reversed: this.reverse,
    })

    return (html`
      <div class$='${className}'>${messageTpl}</div>
    `)
  }

  __renderMessages (list) {
    return list.map((it, i, arr) => this._renderEachMessage(it, i, arr))
  }

  _render ({ list = [] }) {
    const content = !list.length
      ? null
      : (html`<div class='messages-inner'>
        ${this.__renderMessages(list)}
      </div>`)

    return (html`<div class='messages'>${content}</div>`)
  }

  _didRender () {
    this.renderComplete
      .then(() => this.dispatchEvent(new CustomEvent(this.invoke)))
      .catch(error => debug(error.message))
  }
}

export default withStyle(html)(MessagesElement, style, messageStyle, actionStyle)
