import prisma from '../db/prisma.js'

export const getRutinas = async (req, res) => {
  try {
    const rutinas = await prisma.rutina.findMany({
      where: { entrenador_id: req.user.id },
      orderBy: { created_at: 'desc' },
    })
    res.json(rutinas)
  } catch (err) {
    console.error('getRutinas:', err)
    res.status(500).json({ error: 'Error al obtener rutinas' })
  }
}

export const createRutina = async (req, res) => {
  const { nombre, objetivo, dias, ejercicios } = req.body
  if (!nombre || !objetivo || !dias) {
    return res.status(400).json({ error: 'Nombre, objetivo y días son requeridos' })
  }
  try {
    const rutina = await prisma.rutina.create({
      data: {
        nombre,
        objetivo,
        dias: Number(dias),
        ejercicios: ejercicios ?? [],
        entrenador_id: req.user.id,
      },
    })
    res.status(201).json(rutina)
  } catch (err) {
    console.error('createRutina:', err)
    res.status(500).json({ error: 'Error al crear rutina', detail: err.message })
  }
}

export const updateRutina = async (req, res) => {
  const { id } = req.params
  const { nombre, objetivo, dias, ejercicios } = req.body
  try {
    const existing = await prisma.rutina.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.entrenador_id !== req.user.id) {
      return res.status(404).json({ error: 'Rutina no encontrada' })
    }
    const rutina = await prisma.rutina.update({
      where: { id: Number(id) },
      data: { nombre, objetivo, dias: Number(dias), ejercicios },
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
    await prisma.rutina.delete({ where: { id: Number(id) } })
    res.json({ message: 'Rutina eliminada' })
  } catch (err) {
    console.error('deleteRutina:', err)
    res.status(500).json({ error: 'Error al eliminar rutina', detail: err.message })
  }
}
