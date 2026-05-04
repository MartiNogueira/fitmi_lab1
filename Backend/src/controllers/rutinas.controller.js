import prisma from '../db/prisma.js'

export const getRutinas = async (req, res) => {
  try {
    const rutinas = await prisma.rutina.findMany({
      where: { entrenador_id: req.user.id },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
      orderBy: { created_at: 'desc' },
    })
    res.json(rutinas)
  } catch (err) {
    console.error('getRutinas:', err)
    res.status(500).json({ error: 'Error al obtener rutinas' })
  }
}

export const createRutina = async (req, res) => {
  const { nombre, objetivo, dias_semana, ejercicios, usuario_email } = req.body
  if (!nombre || !objetivo || !dias_semana || !ejercicios) {
    return res.status(400).json({ error: 'Nombre, objetivo, días y ejercicios son requeridos' })
  }
  try {
    let usuario_id = null
    if (usuario_email) {
      const usuario = await prisma.usuario.findUnique({ where: { email: usuario_email } })
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
      if (usuario.rol !== 'cliente') return res.status(400).json({ error: 'Solo se puede asignar a clientes' })
      usuario_id = usuario.id_usuario
    }
    const rutina = await prisma.rutina.create({
      data: {
        nombre,
        objetivo,
        dias_semana: Number(dias_semana),
        ejercicios,
        entrenador_id: req.user.id,
        usuario_id,
      },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.status(201).json(rutina)
  } catch (err) {
    console.error('createRutina:', err)
    res.status(500).json({ error: 'Error al crear rutina', detail: err.message })
  }
}

export const updateRutina = async (req, res) => {
  const { id } = req.params
  const { nombre, objetivo, dias_semana, ejercicios, usuario_email } = req.body
  try {
    const existing = await prisma.rutina.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.entrenador_id !== req.user.id) {
      return res.status(404).json({ error: 'Rutina no encontrada' })
    }
    let usuario_id = existing.usuario_id
    if (usuario_email !== undefined) {
      if (usuario_email === '') {
        usuario_id = null
      } else {
        const usuario = await prisma.usuario.findUnique({ where: { email: usuario_email } })
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
        if (usuario.rol !== 'cliente') return res.status(400).json({ error: 'Solo se puede asignar a clientes' })
        usuario_id = usuario.id_usuario
      }
    }
    const rutina = await prisma.rutina.update({
      where: { id: Number(id) },
      data: { nombre, objetivo, dias_semana: Number(dias_semana), ejercicios, usuario_id },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.json(rutina)
  } catch (err) {
    console.error('updateRutina:', err)
    res.status(500).json({ error: 'Error al actualizar rutina', detail: err.message })
  }
}

export const deleteRutina = async (req, res) => {
  const { id } = req.params
  try {
    const existing = await prisma.rutina.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.entrenador_id !== req.user.id) {
      return res.status(404).json({ error: 'Rutina no encontrada' })
    }
    await prisma.ejercicioCompletado.deleteMany({ where: { rutina_id: Number(id) } })
    await prisma.rutina.delete({ where: { id: Number(id) } })
    res.json({ message: 'Rutina eliminada' })
  } catch (err) {
    console.error('deleteRutina:', err)
    res.status(500).json({ error: 'Error al eliminar rutina', detail: err.message })
  }
}
