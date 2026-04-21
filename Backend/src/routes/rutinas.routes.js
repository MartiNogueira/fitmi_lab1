import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import { getRutinas, createRutina, updateRutina, deleteRutina } from '../controllers/rutinas.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/', getRutinas)
router.post('/', createRutina)
router.put('/:id', updateRutina)
router.delete('/:id', deleteRutina)

export default router
