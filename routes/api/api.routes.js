import { Router } from 'express'

/**
 * Router for the API endpoints.
 * @type {Router}
 */
export const apiRouter = new Router()

import apiController from '../../controllers/api/index.js'
import validator from '../../middleware/validator.js'
import rateLimiter from '../../middleware/rateLimiter.js'
import { renderEmailTemplate } from '../../controllers/api/email.js'

/**
 * Route for submitting a time entry.
 * @name POST /timeEntry
 * @function
 * @memberof module:routes/api/api.routes
 * @param {function} rateLimiter - Middleware for rate limiting.
 * @param {function} validator - Middleware for request validation.
 * @param {function} apiController.submit - Controller function for handling the request.
 */
apiRouter.post('/timeEntry', rateLimiter, validator, renderEmailTemplate, apiController.submit)
