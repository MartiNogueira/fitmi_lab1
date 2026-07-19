import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import prisma from './db/prisma.js'

let io = null

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
        await prisma.mensaje.updateMany({
          where: {
            remitente_id: Number(fromUserId),
            destinatario_id: socket.user.id,
            leido: false,
          },
          data: { leido: true },
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
