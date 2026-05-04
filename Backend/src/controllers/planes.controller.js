import prisma from '../db/prisma.js'

export const getPlanes = async (req, res) => {
  try {
    const planes = await prisma.planAlimenticio.findMany({
      where: { nutricionista_id: req.user.id },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
      orderBy: { created_at: 'desc' },
    })
    res.json(planes)
  } catch (err) {
    console.error('getPlanes:', err)
    res.status(500).json({ error: 'Error al obtener planes' })
  }
}

export const createPlan = async (req, res) => {
  const { nombre, objetivo, dias, usuario_email } = req.body
  if (!nombre || !objetivo || !dias) {
    return res.status(400).json({ error: 'Nombre, objetivo y días son requeridos' })
  }
  try {
    let usuario_id = null
    if (usuario_email) {
      const usuario = await prisma.usuario.findUnique({ where: { email: usuario_email } })
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
      if (usuario.rol !== 'cliente') return res.status(400).json({ error: 'Solo se puede asignar a clientes' })
      usuario_id = usuario.id_usuario
    }
    const plan = await prisma.planAlimenticio.create({
      data: {
        nombre,
        objetivo,
        dias,
        nutricionista_id: req.user.id,
        usuario_id,
      },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
    })
    res.status(201).json(plan)
  } catch (err) {
    console.error('createPlan:', err)
    res.status(500).json({ error: 'Error al crear plan', detail: err.message })
  }
}

export const updatePlan = async (req, res) => {
  const { id } = req.params
  const { nombre, objetivo, dias, usuario_email } = req.body
  try {
    const existing = await prisma.planAlimenticio.findUnique({ where: { id: Number(id) } })
    if (!existing || existing.nutricionista_id !== req.user.id) {
      return res.status(404).json({ error: 'Plan no encontrado' })
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
    const plan = await prisma.planAlimenticio.update({
      where: { id: Number(id) },
      data: { nombre, objetivo, dias, usuario_id },
      include: { usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } } },
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
    await prisma.comidaCompletada.deleteMany({ where: { plan_id: Number(id) } })
    await prisma.planAlimenticio.delete({ where: { id: Number(id) } })
    res.json({ message: 'Plan eliminado' })
  } catch (err) {
    console.error('deletePlan:', err)
    res.status(500).json({ error: 'Error al eliminar plan', detail: err.message })
  }
}
