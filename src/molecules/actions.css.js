import { css } from 'lit-element';

export const style = css`
  :host {
    --actions-action-icon-size: 16px;
    --actions-background-color: var(--chat-message-actions-background-color, var(--white, #fff));
    /* stylelint-disable-next-line declaration-colon-newline-after */
    --actions-border-color-disabled: var(
      --chat-message-actions-border-color-disabled,
      var(--silver, #b8b8b8)
    );
    /* stylelint-disable-next-line declaration-colon-newline-after */
    --actions-border-color-hover: var(
      --chat-message-actions-border-color-hover,
      var(--pictonblue, #48a1e6)
    );
    --actions-border-color: var(--chat-message-actions-border-color, var(--silver, #b8b8b8));
    --actions-color-disabled: var(--chat-message-actions-color-disabled, var(--silver, #b8b8b8));
    /* stylelint-disable-next-line declaration-colon-newline-after */
    --actions-color-fill-hover: var(
      --chat-message-actions-color-fill-hover,
      var(--pictonblue, #48a1e6)
    );
    --actions-color-fill: var(--chat-message-actions-color-fill, var(--silver, #b8b8b8));
    --actions-color: var(--chat-message-actions-color, var(--silver, #b8b8b8));
    --actions-color-hover: var(--chat-message-actions-color-hover, var(--pictonblue, #48a1e6));
    --actions-reactions-shift: -1px;
    --actions-transition-delay: var(--chat-message-transition-delay, 0.25s);
  }

  /** reactions */
  :host .reaction {
    height: 36px;
  }

  :host .reactions-group {
    background: var(--actions-background-color);
    border: 1px solid;
    border-color: var(--actions-border-color);
    border-radius: 5px;
    left: var(--actions-reactions-shift);
    min-height: 100%;
    opacity: 0;
    position: absolute;
    top: var(--actions-reactions-shift);
    transition: all ease-out var(--actions-transition-delay);
    width: 100%;
    z-index: -1;
  }

  :host .reactions:hover .reactions-group {
    border-color: var(--actions-border-color-hover);
    opacity: 1;
    z-index: 200;
  }

  :host .reaction > svg,
  :host .action > svg {
    height: var(--actions-action-icon-size);
    padding: 10px 11px;
    transition: all ease-out var(--actions-transition-delay);
    width: var(--actions-action-icon-size);
  }

  /** actions */
  :host .action {
    background-color: transparent;
    border: none;
    cursor: pointer;
    outline: none;
    padding: 0;
  }

  :host .action:disabled {
    cursor: not-allowed;
  }

  :host .action > svg path {
    fill: var(--actions-color-fill);
  }

  :host .action.user-disable > svg {
    height: calc(var(--actions-action-icon-size) + 2px);
  }

  :host .action:hover:not(:disabled) > svg path {
    fill: var(--actions-color-fill-hover);
  }

  :host .actions {
    cursor: default;
    float: right;
    height: 24px;
    line-height: 18px;
    position: relative;
    text-align: center;
    width: 24px;
  }

  :host .actions:hover {
    opacity: 1;
  }

  /* stylelint-disable-next-line no-descending-specificity */
  :host .actions:hover > svg path {
    fill: var(--actions-color-fill-hover);
  }

  :host .actions-inner {
    display: none;
    flex-direction: column;
    margin-left: -8px;
    opacity: 0;
    position: absolute;
    z-index: -1;
  }

  :host .actions:hover .actions-inner {
    display: flex;
    opacity: 1;
    z-index: 100;
  }

  :host .actions-group {
    background: var(--actions-background-color);
    border: 1px solid;
    border-color: var(--actions-border-color);
    border-radius: 5px;
    color: var(--actions-color);
    display: flex;
    flex-direction: column;
    position: relative;
    user-select: none;
  }

  :host .actions-group:hover {
    border-color: var(--actions-border-color-hover);
    color: var(--actions-color-hover);
  }

  :host .reaction:hover > svg,
  :host .action:hover:not(:disabled) > svg {
    transform: scale(1.2);
  }

  :host .reaction-add {
    background: transparent;
    border: 0;
    border-radius: 100%;
    font-size: var(--actions-action-icon-size);
    outline: none;
    padding: 5px 11px;
    transition: transform ease-out var(--actions-transition-delay);
    user-select: none;
    width: 100%;
  }

  :host .reaction-add:hover {
    transform: scale(1.2);
  }

  :host .reaction-add.disabled {
    border-color: var(--actions-border-color-disabled);
    color: var(--actions-color-disabled);
    cursor: not-allowed;
  }

  :host .reaction-add:hover:not(.disabled) svg path {
    fill: var(--actions-color-hover);
  }

  :host .quickdelete {
    background: rgba(0, 0, 0, 0.47);
    border-radius: 100%;
    height: 32px;
    left: 0;
    opacity: 0;
    position: absolute;
    top: 0;
    transition: opacity ease-out var(--actions-transition-delay);
    width: 32px;
  }

  :host .quickdelete:hover {
    opacity: 1;
  }

  /* stylelint-disable-next-line no-descending-specificity */
  :host .quickdelete > svg {
    height: 10px;
    padding: 0;
    padding-top: 2px;
  }

  /* stylelint-disable-next-line no-descending-specificity */
  :host .quickdelete > svg path {
    fill: var(--actions-background-color) !important;
  }
`;
