const express = require('express')
const router = express.Router()
const { register, registerProfesional, login, updateMe, deleteMe } = require('../controllers/auth.controller')
const authMiddleware = require('../middleware/auth.middleware')

router.post('/register', register)
router.post('/register-profesional', registerProfesional)
router.post('/login', login)
router.put('/me', authMiddleware, updateMe)
router.delete('/me', authMiddleware, deleteMe)

module.exports = router
