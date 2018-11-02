import invariant from 'invariant'

const _ = ns => (cond, ...argv) => invariant(cond, ...argv) // eslint-disable-line no-unused-vars

export const registerCustomElement = (key, value) => {
  if (!key || !value) throw new Error('CustomElement is not specified')
  !window.customElements.get(key) && window.customElements.define(key, value)
}

export const Debug = (namespace) => {
  const debug = _(namespace)

  return (...argv) => debug(process.env.NODE_ENV === 'production', ...argv)
}

export const getIndexById = (id, array) => {
  let index

  for (let i = 0; i < array.length; i++) {
    if (array[i].id === id) {
      index = i

      break
    }
  }

  return index
}
