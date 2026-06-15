import express from 'express';
const router = express.Router()
import { register, registerProfesional, login, googleLogin, updateMe, deleteMe } from '../controllers/auth.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

router.post('/register', register)
router.post('/register-profesional', registerProfesional)
router.post('/login', login)
router.post('/google', googleLogin)
router.put('/me', authMiddleware, updateMe)
router.delete('/me', authMiddleware, deleteMe)

export default router;
