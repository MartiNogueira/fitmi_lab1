const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/auth.controller')
const { forgotPassword, resetPassword } = require('../controllers/password.controller')

router.post('/register', register)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

module.exports = router