import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import {
  getComunidades,
  createComunidad,
  updateComunidad,
  deleteComunidad,
  solicitarUnirse,
  getSolicitudesRecibidas,
  responderSolicitudComunidad,
  getMiembrosComunidad,
  getPostsComunidad,
  createPostComunidad,
  deletePostComunidad,
  toggleLikePostComunidad,
  createComentarioPostComunidad,
  deleteComentarioPostComunidad,
} from '../controllers/comunidades.controller.js'

const router = Router()

router.use(authMiddleware)

// Rutas estáticas primero (antes de las parametrizadas)
router.get('/solicitudes-recibidas', getSolicitudesRecibidas)
router.put('/solicitudes/:solicitudId/responder', responderSolicitudComunidad)
router.delete('/posts/:postId', deletePostComunidad)
router.post('/posts/:postId/like', toggleLikePostComunidad)
router.post('/posts/:postId/comentarios', createComentarioPostComunidad)
router.delete('/comentarios/:comentarioId', deleteComentarioPostComunidad)

router.get('/', getComunidades)
router.post('/', createComunidad)
router.get('/:id/posts', getPostsComunidad)
router.post('/:id/posts', createPostComunidad)
router.put('/:id', updateComunidad)
router.delete('/:id', deleteComunidad)
router.post('/:id/solicitar', solicitarUnirse)
router.get('/:id/miembros', getMiembrosComunidad)

export default router