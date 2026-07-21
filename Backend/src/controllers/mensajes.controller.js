import prisma from '../db/prisma.js'
import { getIO } from '../socket.js'

const markConversationAsRead = async ({ fromUserId, readerId }) => {
  const unreadMessages = await prisma.mensaje.findMany({
    where: { remitente_id: fromUserId, destinatario_id: readerId, leido: false },
    select: { id: true },
  })

  if (unreadMessages.length === 0) return []

  await prisma.mensaje.updateMany({
    where: { id: { in: unreadMessages.map((mensaje) => mensaje.id) } },
    data: { leido: true },
  })

  getIO()?.to(`user_${fromUserId}`).emit('mensajes_leidos', {
    readerId,
    messageIds: unreadMessages.map((mensaje) => mensaje.id),
  })

  return unreadMessages
}

export const getConversacion = async (req, res) => {
  const { userId } = req.params
  const otherUserId = Number(userId)
  if (!Number.isInteger(otherUserId)) {
    return res.status(400).json({ error: 'Usuario inválido' })
  }
  try {
    const mensajes = await prisma.mensaje.findMany({
      where: {
        OR: [
          { remitente_id: req.user.id, destinatario_id: otherUserId },
          { remitente_id: otherUserId, destinatario_id: req.user.id },
        ],
      },
      orderBy: { created_at: 'asc' },
    })
    // Marcar como leídos los mensajes que le llegaron al usuario actual
    await markConversationAsRead({ fromUserId: otherUserId, readerId: req.user.id })
    res.json(mensajes)
  } catch (err) {
    console.error('getConversacion:', err)
    res.status(500).json({ error: 'Error al obtener mensajes' })
  }
}

export const enviarMensaje = async (req, res) => {
  const { userId } = req.params
  const otherUserId = Number(userId)
  const { contenido } = req.body
  if (!Number.isInteger(otherUserId)) return res.status(400).json({ error: 'Usuario inválido' })
  if (!contenido?.trim()) return res.status(400).json({ error: 'El mensaje no puede estar vacío' })
  try {
    const mensaje = await prisma.mensaje.create({
      data: {
        remitente_id: req.user.id,
        destinatario_id: otherUserId,
        contenido: contenido.trim(),
      },
    })
    getIO()?.to(`user_${otherUserId}`).emit('nuevo_mensaje', mensaje)
    res.status(201).json(mensaje)
  } catch (err) {
    console.error('enviarMensaje:', err)
    res.status(500).json({ error: 'Error al enviar mensaje' })
  }
}

export const getNoLeidos = async (req, res) => {
  try {
    const count = await prisma.mensaje.count({
      where: { destinatario_id: req.user.id, leido: false },
    })
    res.json({ count })
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
}

export const getInterlocutores = async (req, res) => {
  try {
    const [mensajes, vinculos] = await Promise.all([
      prisma.mensaje.findMany({
        where: {
          OR: [{ remitente_id: req.user.id }, { destinatario_id: req.user.id }],
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.vinculo.findMany({
        where: {
          estado: 'activo',
          OR: [{ usuario_id: req.user.id }, { profesional_id: req.user.id }],
        },
        include: {
          usuario: { select: { id_usuario: true, nombre_usuario: true, email: true, rol: true } },
          profesional: { select: { id_usuario: true, nombre_usuario: true, email: true, rol: true } },
        },
      }),
    ])
    const idsVistos = new Set()
    const interlocutorIds = []
    for (const m of mensajes) {
      const otherId = m.remitente_id === req.user.id ? m.destinatario_id : m.remitente_id
      if (!idsVistos.has(otherId)) { idsVistos.add(otherId); interlocutorIds.push(otherId) }
    }
    for (const vinculo of vinculos) {
      const otherId = vinculo.usuario_id === req.user.id ? vinculo.profesional_id : vinculo.usuario_id
      if (!idsVistos.has(otherId)) { idsVistos.add(otherId); interlocutorIds.push(otherId) }
    }
    const usuarios = await prisma.usuario.findMany({
      where: { id_usuario: { in: interlocutorIds } },
      select: { id_usuario: true, nombre_usuario: true, email: true, rol: true },
    })
    const byId = new Map(usuarios.map((usuario) => [usuario.id_usuario, usuario]))
    res.json(interlocutorIds.map((id) => byId.get(id)).filter(Boolean))
  } catch (err) {
    console.error('getInterlocutores:', err)
    res.status(500).json({ error: 'Error al obtener conversaciones' })
  }
}
