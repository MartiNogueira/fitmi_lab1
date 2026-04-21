import prisma from '../db/prisma.js'

export const getPlanes = async (req, res) => {
  try {
    const planes = await prisma.planAlimenticio.findMany({
      where: { nutricionista_id: req.user.id },
      orderBy: { created_at: 'desc' },
    })
    res.json(planes)
  } catch (err) {
    console.error('getPlanes:', err)
    res.status(500).json({ error: 'Error al obtener planes' })
  }
}

export const createPlan = async (req, res) => {
  const { nombre, calorias, objetivo, comidas } = req.body
  if (!nombre || !calorias || !objetivo) {
    return res.status(400).json({ error: 'Nombre, calorías y objetivo son requeridos' })
  }
  try {
    const plan = await prisma.planAlimenticio.create({
      data: {
        nombre,
        calorias,
        objetivo,
        comidas: comidas ?? [],
        nutricionista_id: req.user.id,
      },
    })
    res.status(201).json(plan)
  } catch (err) {
    console.error('createPlan:', err)
    res.status(500).json({ error: 'Error al crear plan', detail: err.message })
  }
}

export const updatePlan = async (req, res) => {
  const { id } = req.params
  const { nombre, calorias, objetivo, comidas } = req.body
  try {
    const existing = await prisma.planAlimenticio.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.nutricionista_id !== req.user.id) {
      return res.status(404).json({ error: 'Plan no encontrado' })
    }
    const plan = await prisma.planAlimenticio.update({
      where: { id: Number(id) },
      data: { nombre, calorias, objetivo, comidas },
    })
    res.json(plan)
  } catch (err) {
    console.error('updatePlan:', err)
    res.status(500).json({ error: 'Error al actualizar plan', detail: err.message })
  }
}

export const deletePlan = async (req, res) => {
  const { id } = req.params
  try {
    const existing = await prisma.planAlimenticio.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.nutricionista_id !== req.user.id) {
      return res.status(404).json({ error: 'Plan no encontrado' })
    }
    await prisma.planAlimenticio.delete({ where: { id: Number(id) } })
    res.json({ message: 'Plan eliminado' })
  } catch (err) {
    console.error('deletePlan:', err)
    res.status(500).json({ error: 'Error al eliminar plan', detail: err.message })
  }
}
