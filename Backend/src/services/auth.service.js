import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from "../db/prisma.js";

import { PendingActivationError } from '../errors/auth.errors.js';

const buildSession = (user) => {
    const token = jwt.sign({ id: user.id_usuario, email: user.email, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return { token, user: { id: user.id_usuario, name: user.nombre_usuario, email: user.email, rol: user.rol }}
}

const ensureUserCanLogin = (user) => {
    if (user.estado === 'pendiente') {
        throw new PendingActivationError();
    }
    if (user.estado === 'rechazado') {
        throw new Error('Tu solicitud fue rechazada. Contactá al administrador.')
    }
}

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

        ensureUserCanLogin(user)
        return buildSession(user)
    }

    static async loginWithGoogle(credential) {
        const googleClientId = process.env.GOOGLE_CLIENT_ID
        if (!googleClientId) {
            throw new Error('Google login no está configurado')
        }

        const params = new URLSearchParams({ id_token: credential })
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?${params.toString()}`)
        if (!response.ok) {
            throw new Error('Token de Google inválido')
        }

        const profile = await response.json()
        if (profile.aud !== googleClientId || profile.email_verified !== 'true' || !profile.email) {
            throw new Error('Token de Google inválido')
        }

        let user = await prisma.usuario.findUnique({ where: { email: profile.email } })
        if (!user) {
            const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10)
            user = await prisma.usuario.create({
                data: {
                    nombre_usuario: profile.name || profile.email.split('@')[0],
                    email: profile.email,
                    contrasena: passwordHash,
                },
            })
        }

        ensureUserCanLogin(user)
        return buildSession(user)
    }
}
