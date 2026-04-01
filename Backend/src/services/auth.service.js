import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../db/prisma.js";

import { PendingActivationError } from '../errors/auth.errors.js';

export default class AuthService {
    static async login(email, password) {
        const user = await prisma.usuario.findUnique({ where: { email } })
        if (!user) {
            throw new Error('Credenciales inválidas')
        }
    
        const valid = await bcrypt.compare(password, user.contrasena)
        if (!valid) {
            throw new Error('Credenciales inválidas')
        }
    
        if (user.estado === 'pendiente') {
            throw new PendingActivationError();
        }
        if (user.estado === 'rechazado') {
            throw new Error('Tu solicitud fue rechazada. Contactá al administrador.')
        }
    
        const token = jwt.sign({ id: user.id_usuario, email: user.email, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '7d' })
        return { token, user: { id: user.id_usuario, name: user.nombre_usuario, email: user.email, rol: user.rol }}
    }
}