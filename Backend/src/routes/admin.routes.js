import express from 'express';

import { getProfesionalesPendientes, aprobarProfesional, rechazarProfesional } from '../controllers/admin.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import adminMiddleware from '../middleware/admin.middleware.js';

const router = express.Router()
router.use(authMiddleware, adminMiddleware)

router.get('/profesionales/pendientes', getProfesionalesPendientes)
router.put('/profesionales/:id/aprobar', aprobarProfesional)
router.put('/profesionales/:id/rechazar', rechazarProfesional)

export default router
