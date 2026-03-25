const express = require('express')
const router = express.Router()
const { getProfesionalesPendientes, aprobarProfesional, rechazarProfesional } = require('../controllers/admin.controller')
const authMiddleware = require('../middleware/auth.middleware')
const adminMiddleware = require('../middleware/admin.middleware')

router.use(authMiddleware, adminMiddleware)

router.get('/profesionales/pendientes', getProfesionalesPendientes)
router.put('/profesionales/:id/aprobar', aprobarProfesional)
router.put('/profesionales/:id/rechazar', rechazarProfesional)

module.exports = router
