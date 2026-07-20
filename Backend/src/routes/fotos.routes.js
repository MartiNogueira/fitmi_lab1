import { Router } from 'express'
import multer from 'multer'
import authMiddleware from '../middleware/auth.middleware.js'
import { subirFoto, getFotos, deleteFoto } from '../controllers/fotos.controller.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.use(authMiddleware)

router.get('/', getFotos)
router.post('/', upload.single('foto'), subirFoto)
router.delete('/:id', deleteFoto)

export default router
