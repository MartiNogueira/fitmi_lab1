const express = require('express')
const router = express.Router()
const { getNotificaciones, marcarLeida, eliminarNotificacion, limpiarNotificaciones } = require('../controllers/notificaciones.controller')
const authMiddleware = require('../middleware/auth.middleware')

router.get('/', authMiddleware, getNotificaciones)
router.put('/:id/leer', authMiddleware, marcarLeida)
router.delete('/:id', authMiddleware, eliminarNotificacion)
router.delete('/', authMiddleware, limpiarNotificaciones)

module.exports = router
