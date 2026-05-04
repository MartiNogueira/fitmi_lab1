import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import {
  getMiRutina,
  getCompletadosRutina,
  toggleEjercicio,
  getMiPlan,
  getCompletadasPlan,
  toggleComida,
  getResumenProgreso,
} from '../controllers/progreso.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/resumen', getResumenProgreso)
router.get('/rutina', getMiRutina)
router.get('/rutina/:rutina_id/completados', getCompletadosRutina)
router.post('/ejercicio/toggle', toggleEjercicio)

router.get('/plan', getMiPlan)
router.get('/plan/:plan_id/completadas', getCompletadasPlan)
router.post('/comida/toggle', toggleComida)

export default router
