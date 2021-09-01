import { css } from 'lit-element';

export const style = css`
  :host .slot-switcher {
    display: block;
    line-height: var(--chat-slot-switcher-line-height, var(--chat-line-height, 120%));
    font-size: var(--chat-slot-switcher-font-size, var(--chat-font-size, 14px));
    font-weight: var(--chat-slot-switcher-font-weight, var(--chat-font-weight, 400));
  }

  :host .slot-switcher i.svg {
    height: 1em;
    width: 1em;
  }

  :host .slot-switcher i.svg {
    position: relative;
  }

  :host .slot-switcher i.svg > svg {
    height: inherit;
    width: inherit;
  }

  :host .slot-switcher i.svg.pin {
    top: 1px;
  }

  :host .slot-switcher i.svg.left-arrow {
    top: 2px;
  }

  :host .slot-switcher .inner {
    color: #48a1e6;
    cursor: pointer;
    display: flex;
    justify-content: flex-end;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: none;
    white-space: nowrap;
  }

  :host .slot-switcher .link {
    background: transparent;
    border: 0;
    color: currentColor;
    cursor: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    outline: none;
    padding-bottom: 10px;
  }

  :host slot[name='filtered-view'] {
    height: calc(100% - 36px);
  }
`;
