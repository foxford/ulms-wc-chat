import { html } from 'lit-element';
import cs from 'classnames-es';

import * as images from '../images/index.js';
import { mapToJSON } from '../utils/index.js';

const tplFromMap = map => mapToJSON(map).map(tuple => tuple[1]);

export const actionImages = new Map([
  ['message-delete', images.del],
  ['user-disable', images.block],
  ['message-pin', images.pin],
  ['message-unpin', images.pin],
]);

// TODO: Add i18n support
export const actionTexts = new Map([
  ['message-delete', 'DELETE'],
  ['user-disable', 'Заблокировать'],
  ['message-pin', 'Закрепить'],
  ['message-unpin', 'Открепить'],
]);

export const action = ({
  allowed,
  children,
  classname,
  disabled,
  handler,
  key,
  message,
  name,
  text,
}) => {
  const cls = cs({
    allowed,
    [classname]: classname,
    [key]: key,
    [name]: name,
    action: true,
    disabled,
  });

  if (typeof allowed !== 'undefined' && !allowed) return undefined;

  const child =
    classname === 'quickdelete'
      ? children
      : html`
          ${text} ${children}
        `;

  return html`
    <button @click=${e => handler && handler(e, message)} class=${cls} name="action" title=${text}>
      ${child}
    </button>
  `;
};

export const reaction = ({ disabled, handler, message }) => {
  const cls = cs({ 'reaction-add': true, disabled });
  const config = () => new Map([['thumbsup', { name: ':thumbsup' }]]);

  return html`
    <button
      .disabled=${disabled}
      @click=${e => handler && handler(e, { message })}
      class=${cls}
      name="reactions"
    >
      <wc-chat-reactions
        .config=${config()}
        ?showall=${true}
        direction="column"
      ></wc-chat-reactions>
    </button>
  `;
};

export const reactions = ({ children }) => html`
  <div class="reactions">
    <div class="reaction">${images.smiley}</div>
    <div class="reactions-group">
      ${children}
    </div>
  </div>
`;

export const actions = ({ actions: actns, reactions: rctns }) =>
  (actns.size || rctns.size) &&
  html`
    <div class="actions-group">
      ${actns.size ? tplFromMap(actns) : undefined}
      ${rctns.size ? reactions({ children: tplFromMap(rctns) }) : undefined}
    </div>
  `;
