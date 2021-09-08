import { fromEvent } from 'most/src/source/fromEvent.js';
import { LitElement, html } from 'lit-element';
import cs from 'classnames-es';
import compose from 'ramda/es/compose.js';

import { observeC as observe, filterC as filter, throttleC as throttle } from '../utils/most.js';
import { button as buttonEl } from '../atoms/button.js';
import { textarea as textaeraEl } from '../atoms/textarea.js';
import { withStyle } from '../mixins/with-style.js';
import { style as textareaStyle } from '../atoms/textarea.css.js';
import { style as buttonStyle } from '../atoms/button.css.js';
import { SymbolRangeProcessor, ranges } from '../utils/processors.js';

import { style as inputStyle } from './input.css.js';

const isKeyCode = (keyCode, code) => keyCode === code;

const isMetaBtn = ({ keyCode }) => isKeyCode(keyCode, 91);
const isEnterBtn = ({ keyCode }) => isKeyCode(keyCode, 13);
const isControlBtn = ({ keyCode }) => isKeyCode(keyCode, 17);
const isShiftBtn = ({ keyCode }) => isKeyCode(keyCode, 16);

function pad(num, size) {
  return `000${num}`.slice(size * -1);
}

function sec2time(timeInSeconds) {
  const minutes = Math.floor(timeInSeconds / 60) % 60;
  const seconds = Math.floor(timeInSeconds - minutes * 60);

  return `${pad(minutes, 2)}:${pad(seconds, 2)}`;
}

export class _InputElement extends LitElement {
  static get properties() {
    return {
      delay: { type: Number },
      disabled: { type: Boolean },
      maxlength: { type: Number },
      maxrows: { type: Number },
      placeholder: String,
      placeholderdisabled: String,
      preprocessors: String,
      timer: { type: Number },
      value: String,
    };
  }

  constructor() {
    super();

    this.__onInput = this.__onInput.bind(this);
    this.__onKeyPress = this.__onKeyPress.bind(this);
    this.__onValueChanged = this.__onValueChanged.bind(this);
    this.__underlyingTextarea = undefined;
    this.__pre = undefined;
    this.__post = undefined;
    this.__shake = false;
    this.__shakeTimeoutId = null;
    this.__symRangeProcessor = new SymbolRangeProcessor();
    this.__preprocessorsMap = new Map([['strict', ['latin_extended_additional']]]);

    this.preprocessors = '';
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('bind-value-changed', this.__onValueChanged);
  }

  firstUpdated() {
    this.__onFormActivate(this.shadowRoot.querySelector('form'));
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._underlyingTextarea = undefined;
    this.__pre = undefined;
    this.__post = undefined;

    this.removeEventListener('bind-value-changed', this.__onValueChanged);
  }

  changeValue(value = '') {
    this.value = value;
  }

  __onValueChanged(e) {
    this.value = e.detail.value;

    if (this._underlyingTextarea && this.__pre && this.__post) {
      this._underlyingTextarea.setSelectionRange(this.__pre, this.__post);
      this.__pre = undefined;
      this.__post = undefined;
    }
  }

  __onFormActivate(currentTarget) {
    // eslint-disable-line class-methods-use-this
    const { delay = 0 } = this;

    const keyup$ = fromEvent('keyup', currentTarget);
    const keydown$ = fromEvent('keydown', currentTarget);

    const special = {
      shift: false,
      meta: false,
      control: false,
    };
    const isSpecialPressed = () => special.shift || special.meta || special.control;

    compose(
      observe(this._handleSubmit.bind(this)),
      throttle(Number(delay)),
      filter(() => !isSpecialPressed()),
      filter(isEnterBtn),
    )(keydown$);

    observe(e => {
      // eslint-disable-next-line no-unused-expressions
      isEnterBtn(e) && isSpecialPressed() && this.__insertLinebreak();
    }, keydown$);

    compose(
      observe(({ key }) => {
        special[key.toLowerCase()] = true;
      }),
      filter(e => isShiftBtn(e) || isControlBtn(e) || isMetaBtn(e)),
    )(keydown$);

    compose(
      observe(({ key }) => {
        special[key.toLowerCase()] = false;
      }),
      filter(e => isShiftBtn(e) || isControlBtn(e) || isMetaBtn(e)),
    )(keyup$);
  }

  // eslint-disable-next-line class-methods-use-this
  __onKeyPress(e) {
    // eslint-disable-next-line no-unused-expressions
    isEnterBtn(e) && e.preventDefault();
    // prevent native textarea's enter event
  }

  __onInput(e, element) {
    if (!this.__underlyingTextarea) this.__underlyingTextarea = element;

    e.target.value = this.__processMessage(e.target.value);
  }

  __insertLinebreak() {
    if (!this.__underlyingTextarea) {
      this.changeValue(`${this.value || ''}\n`);

      return;
    }
    const { selectionStart: pre, selectionEnd: post } = this.__underlyingTextarea;

    this.__pre = pre + 1;
    this.__post = pre + 1;

    this.changeValue(`${this.value.slice(0, pre)}\n${this.value.slice(post)}`);
  }

  _handleSubmit(e) {
    e && e.preventDefault(); // eslint-disable-line no-unused-expressions

    if (this.timer) {
      if (!this.__shakeTimeoutId) {
        this.__shake = true;
        this.__shakeTimeoutId = setTimeout(() => {
          clearTimeout(this.__shakeTimeoutId);

          this.__shakeTimeoutId = null;
          this.__shake = false;

          this.requestUpdate();
        }, 1000);

        this.requestUpdate();
      }

      return;
    }

    const message = this.__processMessage(this.value).trim();

    if (message) {
      this.dispatchEvent(new CustomEvent('message-submit', { detail: { message } }));
      this.changeValue('');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  __processMessage(value = '') {
    let val = value;

    const { preprocessors: prep } = this;
    const [preprocessorPlan] = prep.split(',');

    if (preprocessorPlan && preprocessorPlan === 'strict') {
      const prepPlan = this.__preprocessorsMap.get('strict');

      const [newValue] = this.__symRangeProcessor.process(val, prepPlan.map(a => ranges.get(a)));

      val = newValue;
    }

    return val;
  }

  render() {
    const { disabled, maxlength, maxrows, placeholder, placeholderdisabled, timer, value } = this;

    return html`
      <section class=${cs({ input: true, disabled, shakeX: this.__shake })}>
        <form
          @submit=${e => this._handleSubmit(e)}
        >
          ${textaeraEl({
            disabled,
            maxlength,
            maxRows: maxrows,
            onInput: this.__onInput,
            onKeyPress: this.__onKeyPress,
            placeholder: disabled ? placeholderdisabled : placeholder,
            value,
          })}
          ${
            timer || disabled
              ? undefined
              : buttonEl({
                  disabled: !this.__processMessage(value),
                  type: 'submit',
                })
          }
          ${
            timer
              ? html`
                  <div class="timer">${sec2time(timer)}</div>
                `
              : undefined
          }
        <form>
      </section>
    `;
  }
}

export const InputElement = withStyle()(_InputElement, buttonStyle, inputStyle, textareaStyle);
