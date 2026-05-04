import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import { getConversacion, enviarMensaje, getInterlocutores, getNoLeidos } from '../controllers/mensajes.controller.js'

const router = Router()
router.use(authMiddleware)

router.get('/no-leidos', getNoLeidos)
router.get('/', getInterlocutores)
router.get('/:userId', getConversacion)
router.post('/:userId', enviarMensaje)

export default router
