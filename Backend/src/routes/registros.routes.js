import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import {
  getPesoCorporal,
  registrarPesoCorporal,
  getResumenSemanal,
} from '../controllers/registros.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/peso-corporal', getPesoCorporal)
router.post('/peso-corporal', registrarPesoCorporal)

router.get('/resumen-semanal/:usuario_id', getResumenSemanal)

export default router
