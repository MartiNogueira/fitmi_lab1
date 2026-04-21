import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import { getPlanes, createPlan, updatePlan, deletePlan } from '../controllers/planes.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/', getPlanes)
router.post('/', createPlan)
router.put('/:id', updatePlan)
router.delete('/:id', deletePlan)

export default router
