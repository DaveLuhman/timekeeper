import { Router } from 'express'
import indexController from '../controllers/index.js'
import { weeklyDayShift } from '../middleware/util.js'

/**
 * Express router for the index routes.
 * @type {import('express').Router}
 */
export const indexRouter = Router()

/**
 * Route handler for the root path.
 * @name GET /
 * @function
 * @memberof module:indexRouter
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @returns {void}
 */
indexRouter.get('/', weeklyDayShift, indexController.getRoot)

/**
 * Route handler for the timeEntry path.
 * @name POST /timeEntry
 * @function
 * @memberof module:indexRouter
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @returns {void}
 */
indexRouter.post('/timeEntry', (_req, res) => {
  res.redirect('/api/timeEntry')
})

/**
 * Route handler for the login path.
 * @name GET /login
 * @function
 * @memberof module:indexRouter
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @returns {void}
 */
indexRouter.get('/login', (_req, res) => {
  res.redirect('/auth/login')
})

/**
 * Route handler for the register path.
 * @name GET /register
 * @function
 * @memberof module:indexRouter
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @returns {void}
 */
indexRouter.get('/register', (_req, res) => {
  res.redirect('/auth/register')
})

/**
 * Route handler for the logout path.
 * @name POST /logout
 * @function
 * @memberof module:indexRouter
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @returns {void}
 */
indexRouter.post('/logout', (_req, res) => {
  res.redirect('/auth/logout')
})
