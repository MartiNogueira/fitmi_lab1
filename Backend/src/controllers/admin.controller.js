import prisma from '../db/prisma.js';

const getProfesionalesPendientes = async (_req, res) => {
  try {
    const profesionales = await prisma.usuario.findMany({
      where: { estado: 'pendiente' },
      select: { id_usuario: true, nombre_usuario: true, email: true, rol: true, created_at: true },
      orderBy: { created_at: 'asc' },
    })
    res.json(profesionales)
  } catch (err) {
    console.error('Error en getProfesionalesPendientes:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const aprobarProfesional = async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const profesional = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { estado: 'aprobado' },
      select: { nombre_usuario: true, rol: true },
    })
    await prisma.notificacion.updateMany({
      where: { data: { path: ['profesional_id'], equals: id } },
      data: {
        mensaje: `${profesional.nombre_usuario} ha sido aprobado como ${profesional.rol}.`,
        tipo: 'resultado_profesional',
      },
    })
    res.json({ message: 'Profesional aprobado' })
  } catch (err) {
    console.error('Error en aprobarProfesional:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const rechazarProfesional = async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const profesional = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { estado: 'rechazado' },
      select: { nombre_usuario: true, rol: true },
    })
    await prisma.notificacion.updateMany({
      where: { data: { path: ['profesional_id'], equals: id } },
      data: {
        mensaje: `${profesional.nombre_usuario} ha sido rechazado como ${profesional.rol}.`,
        tipo: 'resultado_profesional',
      },
    })
    res.json({ message: 'Profesional rechazado' })
  } catch (err) {
    console.error('Error en rechazarProfesional:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export { getProfesionalesPendientes, aprobarProfesional, rechazarProfesional }
