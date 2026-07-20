import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import { getPlanes, createPlan, updatePlan, deletePlan, generarPlanIA, guardarPlanIA } from '../controllers/planes.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/generar-ia', generarPlanIA)
router.post('/guardar-ia', guardarPlanIA)

router.get('/', getPlanes)
router.post('/', createPlan)
router.put('/:id', updatePlan)
router.delete('/:id', deletePlan)

export default router
