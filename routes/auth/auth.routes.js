import  { GET_authLogin, GET_authRegister } from '../../controllers/auth.js'
import { Router } from 'express'
import {login, registerUser, logout} from '../../middleware/auth.js'

export const authRouter = Router()
authRouter.get('/login', GET_authLogin)

authRouter.post('/login', login, (req, res) => {
    res.redirect('/admin/')
})

authRouter.get('/register', GET_authRegister)

authRouter.post('/register', registerUser, login, (_req, res) => {
    res.redirect('/admin/')
})
authRouter.post('/logout', logout);