import { Error as MongooseError } from 'mongoose'
import Customer from '../models/customer.js'
import Timecard from '../models/timecard.js'

function getRootDomain(url) {
  return url.substring(5)
}
function confirmTimeSubdomain(hostname) {
  if (hostname.substring(0, 5) !== 'time.')
    return new MongooseError(
      'Invalid Source. Requests must come from time.domain.tld URL'
    )
  return
}
/**
 * Retrieves this month's entries and filters them by the hostname.
 *
 * @param {string} hostname - The hostname to filter the entries by.
 * @returns {Promise<Array>} - A promise that resolves to an array of entries.
 * @throws {Error} - If an error occurs while retrieving the entries.
 */
async function getThisMonthsEntriesBySourceURL(hostname) {
  // gets this months entries and filters them by the hostname
  const entries = await Timecard.getThisMonths()
  return entries.filter((entry) => entry.sourceURL === hostname)
}

/**
 * Gets the customer record from MongoDB based on the provided hostname,
 * or creates a new customer record if none exists.
 *
 * @param {string} hostname - The hostname from which the request is made.
 * @returns {Promise<Object|string>} - A promise that resolves to the customer record if found or created,
 *                                    or an error message if an error occurs.
 */
async function identifyOrCreateCustomer(hostname) {
  // gets customer record from MongoDB or creates one if none exists
  await confirmTimeSubdomain(hostname) //throws error if req not from time.* url
  return (
    (await Customer.findOne({
      rootDomain: { $eq: getRootDomain(hostname) },
    })) ||
    (await Customer.create({
      rootDomain: getRootDomain(hostname),
      paymentTier: 0,
    }))
  ) // find the customer if they exist in the db or create a new one
}
/**
 * Checks the number of entries against the payment tier limit for a customer.
 * @param {Object} customer - The customer object.
 * @param {string} hostname - The hostname.
 * @throws {Error} Throws an error if the entry limit is exceeded.
 * @returns {Promise<void>} A promise that resolves with no value.
 */
async function checkEntriesCountAgainstPaymentTier(customer, hostname) {
  let entriesLimit = 0
  const entries = await getThisMonthsEntriesBySourceURL(hostname)
  console.log(
    `${JSON.stringify(customer)} has submitted ${entries.length} time entries this month.`
  )
  switch (customer.paymentTier) {
    case 0: // limit to 10 reports per month
      entriesLimit = 10
      break
    case 1: // limit to 50 reports per month
      entriesLimit = 50
      break
    case 2: // unlimited entries
      entriesLimit = 10000000
      //no limit, just here to catch this case
      break
  }
  if (entriesLimit <= entries.length) {
    throw new Error(
      'You have exceeded your entry limit for this calendar month.'
    )
  }
  return
}

/**
 * Middleware function for rate limiting requests.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the middleware is complete.
 */
const rateLimiter = async function rateLimiterWrapper(req, res, next) {
  try {
    const hostname = req.body.sourceURL
    const customer = await identifyOrCreateCustomer(hostname)
    await checkEntriesCountAgainstPaymentTier(customer, hostname)
    next()
  } catch (err) {
    res.status(429).send(err.message)
  }
}

export default rateLimiter
