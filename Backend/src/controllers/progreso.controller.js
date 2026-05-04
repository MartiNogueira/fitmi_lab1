import prisma from '../db/prisma.js'

function hoyRango() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)
  return { hoy, manana }
}

// ── Rutina del usuario ────────────────────────────────────────────────────────

export const getMiRutina = async (req, res) => {
  try {
    const rutina = await prisma.rutina.findFirst({
      where: { usuario_id: req.user.id },
      orderBy: { created_at: 'desc' },
    })
    res.json(rutina)
  } catch (err) {
    console.error('getMiRutina:', err)
    res.status(500).json({ error: 'Error al obtener rutina' })
  }
}

export const getCompletadosRutina = async (req, res) => {
  const { rutina_id } = req.params
  const { hoy, manana } = hoyRango()
  try {
    const completados = await prisma.ejercicioCompletado.findMany({
      where: {
        usuario_id: req.user.id,
        rutina_id: Number(rutina_id),
        fecha: { gte: hoy, lt: manana },
      },
    })
    res.json(completados)
  } catch (err) {
    console.error('getCompletadosRutina:', err)
    res.status(500).json({ error: 'Error al obtener progreso' })
  }
}

export const toggleEjercicio = async (req, res) => {
  const { rutina_id, dia_numero, ejercicio_nombre } = req.body
  if (!rutina_id || dia_numero == null || !ejercicio_nombre) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }
  const { hoy, manana } = hoyRango()
  try {
    const existing = await prisma.ejercicioCompletado.findFirst({
      where: {
        usuario_id: req.user.id,
        rutina_id: Number(rutina_id),
        dia_numero: Number(dia_numero),
        ejercicio_nombre,
        fecha: { gte: hoy, lt: manana },
      },
    })
    if (existing) {
      await prisma.ejercicioCompletado.delete({ where: { id: existing.id } })
      return res.json({ completado: false })
    }
    await prisma.ejercicioCompletado.create({
      data: {
        usuario_id: req.user.id,
        rutina_id: Number(rutina_id),
        dia_numero: Number(dia_numero),
        ejercicio_nombre,
      },
    })
    res.json({ completado: true })
  } catch (err) {
    console.error('toggleEjercicio:', err)
    res.status(500).json({ error: 'Error al actualizar progreso' })
  }
}

export const getResumenProgreso = async (req, res) => {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const diaSemana = (hoy.getDay() + 6) % 7
    const lunesActual = new Date(hoy)
    lunesActual.setDate(hoy.getDate() - diaSemana)
    const proximoLunes = new Date(lunesActual)
    proximoLunes.setDate(lunesActual.getDate() + 7)

    const completadosSemana = await prisma.ejercicioCompletado.findMany({
      where: {
        usuario_id: req.user.id,
        fecha: { gte: lunesActual, lt: proximoLunes },
      },
      select: { fecha: true },
    })

    const semana = Array(7).fill(false)
    completadosSemana.forEach(c => {
      const d = new Date(c.fecha)
      d.setHours(0, 0, 0, 0)
      semana[(d.getDay() + 6) % 7] = true
    })

    const hace60 = new Date(hoy)
    hace60.setDate(hoy.getDate() - 60)
    const manana = new Date(hoy)
    manana.setDate(hoy.getDate() + 1)

    const todosCompletados = await prisma.ejercicioCompletado.findMany({
      where: {
        usuario_id: req.user.id,
        fecha: { gte: hace60, lt: manana },
      },
      select: { fecha: true },
    })

    const diasConEjercicio = new Set(
      todosCompletados.map(c => {
        const d = new Date(c.fecha)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
    )

    let racha = 0
    const cursor = new Date(hoy)
    if (!diasConEjercicio.has(cursor.getTime())) {
      cursor.setDate(cursor.getDate() - 1)
    }
    while (diasConEjercicio.has(cursor.getTime())) {
      racha++
      cursor.setDate(cursor.getDate() - 1)
    }

    res.json({ racha, semana })
  } catch (err) {
    console.error('getResumenProgreso:', err)
    res.status(500).json({ error: 'Error al obtener resumen' })
  }
}

// ── Plan del usuario ──────────────────────────────────────────────────────────

export const getMiPlan = async (req, res) => {
  try {
    const plan = await prisma.planAlimenticio.findFirst({
      where: { usuario_id: req.user.id },
      orderBy: { created_at: 'desc' },
    })
    res.json(plan)
  } catch (err) {
    console.error('getMiPlan:', err)
    res.status(500).json({ error: 'Error al obtener plan' })
  }
}

export const getCompletadasPlan = async (req, res) => {
  const { plan_id } = req.params
  const { hoy, manana } = hoyRango()
  try {
    const completadas = await prisma.comidaCompletada.findMany({
      where: {
        usuario_id: req.user.id,
        plan_id: Number(plan_id),
        fecha: { gte: hoy, lt: manana },
      },
    })
    res.json(completadas)
  } catch (err) {
    console.error('getCompletadasPlan:', err)
    res.status(500).json({ error: 'Error al obtener progreso' })
  }
}

export const toggleComida = async (req, res) => {
  const { plan_id, dia_numero, comida_nombre } = req.body
  if (!plan_id || dia_numero == null || !comida_nombre) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }
  const { hoy, manana } = hoyRango()
  try {
    const existing = await prisma.comidaCompletada.findFirst({
      where: {
        usuario_id: req.user.id,
        plan_id: Number(plan_id),
        dia_numero: Number(dia_numero),
        comida_nombre,
        fecha: { gte: hoy, lt: manana },
      },
    })
    if (existing) {
      await prisma.comidaCompletada.delete({ where: { id: existing.id } })
      return res.json({ completado: false })
    }
    await prisma.comidaCompletada.create({
      data: {
        usuario_id: req.user.id,
        plan_id: Number(plan_id),
        dia_numero: Number(dia_numero),
        comida_nombre,
      },
    })
    res.json({ completado: true })
  } catch (err) {
    console.error('toggleComida:', err)
    res.status(500).json({ error: 'Error al actualizar progreso' })
  }
}
