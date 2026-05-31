import moment from 'moment'

function blockHelper(test, options) {
  return test ? options.fn(this) : options.inverse(this)
}

export const handlebarsHelpers = {
  eq(a, b, options) {
    return blockHelper.call(this, a === b, options)
  },
  gt(a, b, options) {
    return blockHelper.call(this, a > b, options)
  },
  lt(a, b, options) {
    return blockHelper.call(this, a < b, options)
  },
  is(a, b, options) {
    return blockHelper.call(this, a === b, options)
  },
  isnt(a, b, options) {
    return blockHelper.call(this, a !== b, options)
  },
  ifEven(value, options) {
    return blockHelper.call(this, Number(value) % 2 === 0, options)
  },
  or(...args) {
    const options = args.pop()
    return blockHelper.call(this, args.some(Boolean), options)
  },
  minus(a, b) {
    return Number(a) - Number(b)
  },
  encodeURI(value) {
    return encodeURIComponent(String(value ?? ''))
  },
  JSONstringify(value) {
    return JSON.stringify(value)
  },
  moment(value, format) {
    if (!value) return ''
    return moment(value).format(String(format ?? ''))
  },
}
