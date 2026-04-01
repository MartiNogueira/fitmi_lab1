import prisma from '../db/prisma.js';

const getNotificaciones = async (req, res) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: { destinatario_id: req.user.id },
      orderBy: { created_at: 'desc' },
    })
    res.json(notificaciones)
  } catch (err) {
    console.error('Error en getNotificaciones:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const marcarLeida = async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    await prisma.notificacion.update({
      where: { id, destinatario_id: req.user.id },
      data: { leida: true },
    })
    res.json({ message: 'Notificación marcada como leída' })
  } catch (err) {
    console.error('Error en marcarLeida:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const eliminarNotificacion = async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    await prisma.notificacion.delete({ where: { id, destinatario_id: req.user.id } })
    res.json({ message: 'Notificación eliminada' })
  } catch (err) {
    console.error('Error en eliminarNotificacion:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const limpiarNotificaciones = async (req, res) => {
  try {
    await prisma.notificacion.deleteMany({ where: { destinatario_id: req.user.id } })
    res.json({ message: 'Notificaciones eliminadas' })
  } catch (err) {
    console.error('Error en limpiarNotificaciones:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export { getNotificaciones, marcarLeida, eliminarNotificacion, limpiarNotificaciones }
