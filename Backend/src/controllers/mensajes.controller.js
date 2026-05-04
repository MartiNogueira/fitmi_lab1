import prisma from '../db/prisma.js'

export const getConversacion = async (req, res) => {
  const { userId } = req.params
  try {
    const mensajes = await prisma.mensaje.findMany({
      where: {
        OR: [
          { remitente_id: req.user.id, destinatario_id: Number(userId) },
          { remitente_id: Number(userId), destinatario_id: req.user.id },
        ],
      },
      orderBy: { created_at: 'asc' },
    })
    // Marcar como leídos los mensajes que le llegaron al usuario actual
    await prisma.mensaje.updateMany({
      where: { remitente_id: Number(userId), destinatario_id: req.user.id, leido: false },
      data: { leido: true },
    })
    res.json(mensajes)
  } catch (err) {
    console.error('getConversacion:', err)
    res.status(500).json({ error: 'Error al obtener mensajes' })
  }
}

export const enviarMensaje = async (req, res) => {
  const { userId } = req.params
  const { contenido } = req.body
  if (!contenido?.trim()) return res.status(400).json({ error: 'El mensaje no puede estar vacío' })
  try {
    const mensaje = await prisma.mensaje.create({
      data: {
        remitente_id: req.user.id,
        destinatario_id: Number(userId),
        contenido: contenido.trim(),
      },
    })
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
    const mensajes = await prisma.mensaje.findMany({
      where: {
        OR: [{ remitente_id: req.user.id }, { destinatario_id: req.user.id }],
      },
      orderBy: { created_at: 'desc' },
    })
    const idsVistos = new Set()
    const interlocutorIds = []
    for (const m of mensajes) {
      const otherId = m.remitente_id === req.user.id ? m.destinatario_id : m.remitente_id
      if (!idsVistos.has(otherId)) { idsVistos.add(otherId); interlocutorIds.push(otherId) }
    }
    const usuarios = await prisma.usuario.findMany({
      where: { id_usuario: { in: interlocutorIds } },
      select: { id_usuario: true, nombre_usuario: true, email: true, rol: true },
    })
    res.json(usuarios)
  } catch (err) {
    console.error('getInterlocutores:', err)
    res.status(500).json({ error: 'Error al obtener conversaciones' })
  }
}
