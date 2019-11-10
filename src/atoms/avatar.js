import { html } from 'lit-element'
import cs from 'classnames-es'

export const avatar = ({
  classname,
  image,
} = {}) => (html`
  <div class=${cs({ classname, 'avatar': true })}>
    <div style=${!image ? '' : `background-image: url(${image});`}></div>
  </div>
`)
