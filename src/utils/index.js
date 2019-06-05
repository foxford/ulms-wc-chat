import Debug from 'debug'
import invariant from 'invariant'

// eslint-disable-next-line no-unused-vars
const _ = ns => (cond, ...argv) => invariant(cond, ...argv)

export const Invariant = (namespace) => {
  const nvrnt = _(namespace)

  return (...argv) => nvrnt(process.env.NODE_ENV === 'production', ...argv)
}

export const debug = (namespace) => {
  const deb = Debug(namespace)

  return (...argv) => process.env.NODE_ENV !== 'production' ? deb(...argv) : undefined
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

export const stampToDate = stamp => new Date(stamp * 1e3)

export const formatDate = (date, pattern = /\d{2}:\d{2}/) => date.toTimeString().match(pattern)

export const isAggregatedBy = (field, index, list) => (!index || !field)
  ? false
  : list[index][field] === list[index - 1][field]

export const isLastseen = ({
  index,
  lastseen,
  list,
  reverse,
}) => {
  const idx = reverse ? index + 1 : index - 1

  return lastseen !== undefined
    ? list[idx]
      ? list[idx].id === lastseen
      : undefined
    : undefined
}
