import Customer from '../models/customer.js'
import Timecard from '../models/timecard.js'
import { Error } from 'mongoose' // Add the missing import statement for the Error class


function getRootDomain(url) {
  return String(url.substring(5))
}
function confirmTimeSubdomain(hostname) {
  try {
    if (hostname.substring(0, 5) !== 'time.')
      return new Error(
        'Invalid Source. Requests must come from time.domain.tld URL'
      )
    return
  } catch (err) {
    return err.message
  }
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
  try {
    const entries = await Timecard.getThisMonths()
    const filteredEntries = entries.filter((entry) => {
      return entry.sourceURL === hostname
    })
    return filteredEntries
  } catch (err) {
    return err.message
  }
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
  try {
    let customer = undefined //init customer variable mutably
    confirmTimeSubdomain(hostname) //throws error if req not from time.* url
    customer = await Customer.findOne({
      rootDomain: { $eq: getRootDomain(hostname) },
    }) // find the customer if they exist in the db
    if (!customer) {
      customer = await Customer.create({
        rootDomain: getRootDomain(hostname),
        paymentTier: 0,
      }) //create new customer in DB with req's hostname, trimmed for 'time.'
    }
    return customer
  } catch (err) {
    return err.message
  }
}
/**
 * Checks the number of entries against the payment tier limit for a customer.
 * @param {Object} customer - The customer object.
 * @param {string} hostname - The hostname.
 * @throws {Error} Throws an error if the entry limit is exceeded.
 * @returns {Promise<void>} A promise that resolves with no value.
 */
async function checkEntriesCountAgainstPaymentTier(customer, hostname) {
  let entriesLimit = new Number()
  const entries = await getThisMonthsEntriesBySourceURL(hostname)
  console.log(
    `${JSON.stringify(customer)} has submitted ${
      entries.length
    } time entries this month.`
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
  if (entriesLimit <= entries.length)
    throw new Error(
      'You have exceeded your entry limit for this calendar month.'
    )
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
    return res.status(429).send(err.message)
  }
}

export default rateLimiter
