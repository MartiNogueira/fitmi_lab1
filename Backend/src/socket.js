import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import prisma from './db/prisma.js'

let io = null

const getAllowedOrigins = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('No autenticado'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.user = decoded
      next()
    } catch {
      next(new Error('Token inválido'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(`user_${socket.user.id}`)

    socket.on('mark_read', async ({ fromUserId }) => {
      try {
        const senderId = Number(fromUserId)
        if (!Number.isInteger(senderId)) return

        const unreadMessages = await prisma.mensaje.findMany({
          where: { remitente_id: senderId, destinatario_id: socket.user.id, leido: false },
          select: { id: true },
        })
        if (unreadMessages.length === 0) return

        await prisma.mensaje.updateMany({
          where: { id: { in: unreadMessages.map((mensaje) => mensaje.id) } },
          data: { leido: true },
        })

        io.to(`user_${senderId}`).emit('mensajes_leidos', {
          readerId: socket.user.id,
          messageIds: unreadMessages.map((mensaje) => mensaje.id),
        })
      } catch {}
    })

    socket.on('disconnect', () => {})
  })

  return io
}

export function getIO() {
  return io
}
