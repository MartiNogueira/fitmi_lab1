import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import AuthService from '../services/auth.service.js';
import { PendingActivationError } from '../errors/auth.errors.js';

const register = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y password son requeridos' })
  }

  try {
    const existing = await prisma.usuario.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.usuario.create({
      data: { nombre_usuario: name, email, contrasena: hash },
      select: { id_usuario: true, nombre_usuario: true, email: true, rol: true, estado: true },
    })

    const token = jwt.sign({ id: user.id_usuario, email: user.email, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user.id_usuario, name: user.nombre_usuario, email: user.email, rol: user.rol } })
  } catch (err) {
    console.error('Error en register:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const registerProfesional = async (req, res) => {
  const { name, email, password, especialidad } = req.body

  if (!name || !email || !password || !especialidad) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }
  if (!['entrenador', 'nutricionista'].includes(especialidad)) {
    return res.status(400).json({ error: 'Especialidad inválida' })
  }

  try {
    const existing = await prisma.usuario.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.usuario.create({
      data: { nombre_usuario: name, email, contrasena: hash, rol: especialidad, estado: 'pendiente' },
      select: { id_usuario: true, nombre_usuario: true, email: true, rol: true },
    })

    // Notificar a todos los admins
    const admins = await prisma.usuario.findMany({ where: { rol: 'admin' }, select: { id_usuario: true } })
    if (admins.length > 0) {
      await prisma.notificacion.createMany({
        data: admins.map((admin) => ({
          destinatario_id: admin.id_usuario,
          tipo: 'solicitud_profesional',
          mensaje: `${name} se registró como ${especialidad} y está esperando aprobación.`,
          data: { profesional_id: user.id_usuario, nombre: name, rol: especialidad, email },
        })),
      })
    }

    res.status(201).json({ message: 'Solicitud enviada. Aguardá la aprobación del administrador.' })
  } catch (err) {
    console.error('Error en registerProfesional:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son requeridos' })
  }

  try {
    const { token, user } = await AuthService.login(email, password);
    res.json({ token, user });
  } catch (err) {
    if (err instanceof PendingActivationError) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message === 'Credenciales inválidas') {
      return res.status(401).json({ error: err.message });
    }
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

const googleLogin = async (req, res) => {
  const { credential } = req.body

  if (!credential) {
    return res.status(400).json({ error: 'Token de Google requerido' })
  }

  try {
    const { token, user } = await AuthService.loginWithGoogle(credential)
    res.json({ token, user })
  } catch (err) {
    if (err instanceof PendingActivationError) {
      return res.status(403).json({ error: err.message })
    }
    if (
      err.message === 'Token de Google inválido' ||
      err.message === 'Tu solicitud fue rechazada. Contactá al administrador.'
    ) {
      return res.status(401).json({ error: err.message })
    }
    if (err.message === 'Google login no está configurado') {
      return res.status(500).json({ error: err.message })
    }
    console.error('Error en googleLogin:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const updateMe = async (req, res) => {
  const { name, email, password } = req.body
  const id = req.user.id

  try {
    const data = {}
    if (name) data.nombre_usuario = name
    if (email) data.email = email
    if (password) data.contrasena = await bcrypt.hash(password, 10)

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' })
    }

    if (email) {
      const existing = await prisma.usuario.findUnique({ where: { email } })
      if (existing && existing.id_usuario !== id) {
        return res.status(409).json({ error: 'El email ya está en uso' })
      }
    }

    const user = await prisma.usuario.update({
      where: { id_usuario: id },
      data,
      select: { id_usuario: true, nombre_usuario: true, email: true, rol: true },
    })

    res.json({ user: { id: user.id_usuario, name: user.nombre_usuario, email: user.email, rol: user.rol } })
  } catch (err) {
    console.error('Error en updateMe:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const deleteMe = async (req, res) => {
  const id = req.user.id
  try {
    await prisma.notificacion.deleteMany({ where: { destinatario_id: id } })
    await prisma.usuario.delete({ where: { id_usuario: id } })
    res.json({ message: 'Cuenta eliminada' })
  } catch (err) {
    console.error('Error en deleteMe:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export { register, registerProfesional, login, googleLogin, updateMe, deleteMe };
