import { hash } from 'bcrypt'
import nodemailer from 'nodemailer'
import passport from 'passport'
import Customer from '../models/customer.js'
import User from '../models/user.js'

/**
 * Middleware function to check if the user is authenticated.
 * If the user is authenticated, it sets the user object in the response locals and calls the next middleware.
 * If the user is not authenticated, it redirects to the login page.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
export function checkAuth(req, res, next) {
  console.log(`[AUTH] Request authenticated? ${req.isAuthenticated()}`.blue.bold)
  if (req.isAuthenticated()) {
    res.locals.user = req.user
    return next()
  }
  console.log('[AUTH] Unauthenticated. Redirecting to login page.'.red.bold)
  res.redirect('/auth/login')
}
/**
 * Registers a new user and associates them with a company.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the user is registered.
 */
export async function registerUser(req, res, next) {
  const { email, password, companyName } = req.body
  const newUser = await User.register(email, password)
  const newCustomer = await Customer.register(companyName, email)
  newUser.company = newCustomer.id
  newUser.save()
  console.log(
    `[AUTH] User ${email} has been successfully registered for ${companyName}`.green.bold
  )

  req.login(newUser, (user, err) => {
    if (err) {
      console.log(`[AUTH] Error logging in user ${email}: ${err.message}`.red.bold)
      req.flash('error', err.message)
      return next()
    }
    console.log(`[AUTH] User ${email} logged in successfully`.green.bold)
    res.user = user
  })
  next()
}

/**
 * Authenticates the user using the 'local' strategy.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the authentication is complete.
 */
export async function login(req, res, next) {
  passport.authenticate('local', {
    failureFlash: true,
  })(req, res, next)
}

/**
 * Logs out the user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
export function logout(req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err)
    }
    res.redirect('/')
  })
}

/**
 * Submits a reset password request.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the reset password request is submitted.
 */
export async function submitResetPasswordRequest(req, res) {
  const { email } = req.body
  const user = await User.findByEmail(email)
  if (!user) {
    req.flash('error', 'No user is registered with that email')
    res.redirect('/auth/login')
    res.end()
  } else {
    user.token = createToken()
    user.tokenExpiry = Date.now() + 3600000
    user.save()
    await sendResetPwEmail(user.email, user.token)
    req.flash(
      'info',
      `An e-mail has been sent to ${user.email} with further instructions.`
    )
    res.redirect('/auth/login')
  }
}

/**
 * Generates a random token.
 *
 * @returns {string} The generated token.
 */
function createToken() {
  return Math.random().toString(36).slice(-8)
}

/**
 * Sends a password reset email to the specified email address.
 *
 * @param {string} email - The email address to send the reset email to.
 * @param {string} token - The password reset token.
 * @returns {Promise<void>} - A promise that resolves when the email is sent successfully.
 */

async function sendResetPwEmail(email, token) {
  // Set up nodemailer transporter for SMTP2GO
  const transporter = nodemailer.createTransport({
    host: 'mail.smtp2go.com',
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: process.env.SMTP2GO_USER, // Set in your environment
      pass: process.env.SMTP2GO_PASSWORD, // Set in your environment
    },
  });

  const mailOptions = {
    to: email,
    from: 'no-reply@ado.software',
    subject: 'Timekeeper Password Reset',
    text: `
            Please click on the following link, or paste this into your browser to complete the password reset:
            http://timekeeper.site/auth/forgotPassword/${token}
            If you did not request this, please ignore this email and your password will remain unchanged.
            This link is valid for 24 hours and will expire after that.
        `,
  };

  await transporter.sendMail(mailOptions);
}
/**
 * Verifies the reset password request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the verification is complete.
 */
export async function verifyResetPasswordRequest(req, res ) {
  const token = req.params.token
  const user = await User.findByToken(token)
  if (!user) {
    req.flash('error', 'Password reset token is invalid')
    res.redirect('/auth/login')
  } else if (user.tokenExpiry < Date.now()) {
    req.flash('error', 'Password reset token is expired')
    res.redirect('/auth/login')
  } else {
    res.locals.token = token
    res.render('auth/forgotPassword')
  }
}
/**
 * Executes a reset password request.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the password reset is complete.
 */
export async function executeResetPasswordRequest(req, res ) {
  const token = req.params.token
  const user = await User.findByToken(token)
  if (!user || user.tokenExpiry < Date.now()) {
    req.flash('error', 'Password reset token is invalid or has expired.')
    return res.redirect('/auth/login')
  }
  const { password, confirmPassword } = req.body
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match')
    return res.redirect(`/auth/forgotPassword/${token}`)
  }
  user.password = await hash(password, 10)
  user.token = undefined
  user.tokenExpiry = undefined
  user.save()
  req.flash(
    'success',
    'Your password has been successfully reset. Please log in with your new password.'
  )
  res.redirect('/auth/login')
}
