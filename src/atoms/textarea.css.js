import { css } from 'lit-element'

export const style = css`
/* stylelint-disable-next-line selector-type-no-unknown */
iron-autogrow-textarea {
  -webkit-appearance: none;
  background: var(--bg-color, var(--theme-color-white, #fff));
  border: 1px solid var(--border-color, var(--theme-color-alto, #d4d4d4));
  border-radius: 5px;
  box-sizing: border-box;
  caret-color: var(--caret-color, var(--theme-color-pictonblue, #48a1e6));
  font-size: var(--font-size, var(--theme-font-size, inherit));
  height: inherit;
  line-height: 1.2em;
  max-height: 200px;
  min-height: 52px;
  outline: none;
  -ms-overflow-style: none;
  width: 100%;

  textarea {
    box-sizing: border-box;
  }

  --iron-autogrow-textarea: {
    box-sizing: border-box;
    overflow-wrap: break-word;
    padding: 16px 70px 14px 20px;
    word-break: break-all;
  };

  --iron-autogrow-textarea-placeholder: {
    color: var(--ph-color, var(--theme-color-alto, #d4d4d4));
  };
}

/* stylelint-disable-next-line selector-type-no-unknown */
iron-autogrow-textarea:hover {
  border-color: var(--border-color-hover, var(--theme-color-silver, #b8b8b8));
}

/* stylelint-disable-next-line selector-type-no-unknown */
iron-autogrow-textarea:focus-within {
  border-color: var(--border-color-focus, var(--theme-color-pictonblue, #48a1e6));
}
`
