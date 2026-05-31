import { Router } from 'express'
import passport from 'passport'
import { GET_authLogin, GET_authRegister } from '../../controllers/auth.js'
import {
  executeResetPasswordRequest,
  login,
  logout,
  registerUser,
  submitResetPasswordRequest,
  verifyResetPasswordRequest,
} from '../../middleware/auth.js'

/**
 * Express router for handling authentication routes.
 * @type {import('express').Router}
 */
export const authRouter = Router()

/**
 * Route for handling GET requests to '/login'.
 * @name GET /auth/login
 * @function
 */
authRouter.get('/login', GET_authLogin)

/**
 * Route for handling POST requests to '/login'.
 * Authenticates the user using passport-local strategy.
 * @name POST /auth/login
 * @function
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
authRouter.post(
  '/login',
  passport. authenticate('local', {
    failureRedirect: '/auth/login',
    failureMessage: true,
    failureFlash: true,
  }),
  (req, res) => {
    res.user = req.user
    res.redirect('/admin')
  }
)

/**
 * Route for handling GET requests to '/register'.
 * @name GET /auth/register
 * @function
 */
authRouter.get('/register', GET_authRegister)

/**
 * Route for handling POST requests to '/register'.
 * Registers a new user and logs them in.
 * @name POST /auth/register
 * @function
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
authRouter.post('/register', registerUser, login, (_req, res) => {
  res.redirect('/admin/')
})

/**
 * Route for handling POST requests to '/logout'.
 * Logs out the current user.
 * @name POST /auth/logout
 * @function
 */
authRouter.post('/logout', logout)

/**
 * Route for handling POST requests to '/forgotPassword'.
 * Submits a reset password request.
 * @name POST /auth/forgotPassword
 * @function
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
authRouter.post('/forgotPassword', submitResetPasswordRequest)

/**
 * Route for handling GET requests to '/forgotPassword/:token'.
 * Verifies a reset password request.
 * @name GET /auth/forgotPassword/:token
 * @function
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
authRouter.get('/forgotPassword/:token', verifyResetPasswordRequest)

/**
 * Route for handling POST requests to '/forgotPassword/:token'.
 * Executes a reset password request.
 * @name POST /auth/forgotPassword/:token
 * @function
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
authRouter.post('/forgotPassword/:token', executeResetPasswordRequest)
