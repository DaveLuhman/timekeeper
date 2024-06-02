/*
List of Functions in order (* at beginning means exported)
*rateLimiter
*getPackageVersion
*weeklyDayShift
*/

import rateLimit from 'express-rate-limit';
import moment from 'moment';

/**
 *
 * @param {array} data
 * @param {number} targetPage
 * @param {number} perPage
 * @returns {object} trimmedData, targetPage, pageCount
 */
/**
 * Paginates an array of data.
 *
 * @param {Array} data - The array of data to be paginated.
 * @param {number} targetPage - The target page number.
 * @param {number} perPage - The number of items per page.
 * @returns {Object} - An object containing the trimmed data, target page number, and total page count.
 */
export function paginate (data, targetPage, perPage) {
  perPage = perPage || 10
  targetPage = targetPage || 1
  const pageCount = Math.ceil(data.length / perPage) // number of pages
  const trimmedData = data.slice(
    perPage * targetPage - perPage,
    perPage * targetPage + 1
  )
  return { trimmedData, targetPage, pageCount }
}
/**
 * Middleware function that applies rate limiting to incoming requests.
 *
 * @function rateLimiter
 * @param {Object} options - The rate limiting options.
 * @param {number} options.windowMs - The time window in milliseconds.
 * @param {number} options.max - The maximum number of requests allowed per window.
 * @param {boolean} options.standardHeaders - Whether to return rate limit info in the `RateLimit-*` headers.
 * @param {boolean} options.legacyHeaders - Whether to disable the `X-RateLimit-*` headers.
 * @returns {Function} - The rate limiting middleware function.
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Middleware function to get environment variables and store them in response locals.
 * @param {Object} _req - The request object (not used in this function).
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
export function getEnvironment(_req, res, next) {
  res.locals.backendUrl = process.env.BACKEND_URL
  res.locals.npmPackageVersion = process.env.NPM_PACKAGE_VERSION
  return next()
}

/**
 * Middleware function to expose the user object in the response locals.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
export function exposeUserObject (req, res, next){
  res.locals.user = req.user ? req.user : 'noUser'
  next()
}
/**
 * Shifts the current day to the beginning of the week and calculates the dates for the rest of the week.
 * @param {Object} _req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Function} - The next middleware function.
 */
export function weeklyDayShift (_req, res, next) {
  let days = {}
  let now = new Date
  now = moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').utcOffset(-5)
  const today = moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day()
  if (today === 0) {
    days = [
      { day: 'Sunday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(-7).format('YYYY-MM-DD') },
      { day: 'Monday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(-6).format('YYYY-MM-DD') },
      { day: 'Tuesday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(-5).format('YYYY-MM-DD') },
      { day: 'Wednesday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(-4).format('YYYY-MM-DD') },
      { day: 'Thursday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(-3).format('YYYY-MM-DD') },
      { day: 'Friday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(-2).format('YYYY-MM-DD') },
      { day: 'Saturday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(-1).format('YYYY-MM-DD') }
    ]
  } else {
    days = [
      { day: 'Sunday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(0).format('YYYY-MM-DD') },
      { day: 'Monday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(1).format('YYYY-MM-DD') },
      { day: 'Tuesday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(2).format('YYYY-MM-DD') },
      { day: 'Wednesday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(3).format('YYYY-MM-DD') },
      { day: 'Thursday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(4).format('YYYY-MM-DD') },
      { day: 'Friday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(5).format('YYYY-MM-DD') },
      { day: 'Saturday', date: moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').day(6).format('YYYY-MM-DD') }
    ]
  }
  res.locals.today = moment(now, 'ddd MMM D YYYY HH:mm:ss ZZ').format('dddd')
  res.locals.weeklyDayShift = days
  return next()
}

/**
 * Middleware array.
 * @type {Array<Function>}
 */
export const mw = [weeklyDayShift,getEnvironment,exposeUserObject]