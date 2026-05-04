import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import {
  getProfesionales,
  solicitarVinculo,
  getSolicitudes,
  responderSolicitud,
  getMisClientes,
  getMiVinculo,
} from '../controllers/vinculo.controller.js'

const router = Router()

router.use(authMiddleware)

// Usuario
router.get('/profesionales', getProfesionales)         // ?tipo=entrenador|nutricionista
router.post('/solicitar', solicitarVinculo)
router.get('/mi-vinculo', getMiVinculo)                // ?tipo=entrenador|nutricionista

// Profesional
router.get('/solicitudes', getSolicitudes)
router.put('/:id/responder', responderSolicitud)       // body: { accion: 'aceptar'|'rechazar' }
router.get('/mis-clientes', getMisClientes)

export default router
