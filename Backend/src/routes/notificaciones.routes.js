import express from 'express';
const router = express.Router()

import { getNotificaciones, marcarLeida, eliminarNotificacion, limpiarNotificaciones } from '../controllers/notificaciones.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

router.get('/', authMiddleware, getNotificaciones)
router.put('/:id/leer', authMiddleware, marcarLeida)
router.delete('/:id', authMiddleware, eliminarNotificacion)
router.delete('/', authMiddleware, limpiarNotificaciones)

export default router
