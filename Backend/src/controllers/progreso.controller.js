import prisma from '../db/prisma.js'
import {
  sendInactivityReminders,
  sendProgressReportToProfessionals,
} from '../services/progress-mail.service.js'

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

    const [
      completadosSemana,
      comidasSemana,
      rutinaAsignada,
      planAsignado,
    ] = await Promise.all([
      prisma.ejercicioCompletado.findMany({
        where: {
          usuario_id: req.user.id,
          fecha: { gte: lunesActual, lt: proximoLunes },
        },
        select: { fecha: true },
      }),
      prisma.comidaCompletada.findMany({
        where: {
          usuario_id: req.user.id,
          fecha: { gte: lunesActual, lt: proximoLunes },
        },
        select: { fecha: true },
      }),
      prisma.rutina.findFirst({
        where: { usuario_id: req.user.id },
        orderBy: { created_at: 'desc' },
        select: { ejercicios: true },
      }),
      prisma.planAlimenticio.findFirst({
        where: { usuario_id: req.user.id },
        orderBy: { created_at: 'desc' },
        select: { dias: true },
      }),
    ])

    const semana = Array(7).fill(false)
    completadosSemana.forEach(c => {
      const d = new Date(c.fecha)
      d.setHours(0, 0, 0, 0)
      semana[(d.getDay() + 6) % 7] = true
    })

    const totalEjerciciosSemana = (rutinaAsignada?.ejercicios || []).reduce(
      (sum, dia) => sum + (dia.ejercicios?.length ?? 0),
      0
    )
    const totalComidasSemana = (planAsignado?.dias || []).reduce(
      (sum, dia) => sum + (dia.comidas?.length ?? 0),
      0
    )
    const rutinaCompletadaSemana = completadosSemana.length
    const dietaCompletadaSemana = comidasSemana.length
    const pctRutinaSemana = totalEjerciciosSemana > 0
      ? Math.min(100, Math.round((rutinaCompletadaSemana / totalEjerciciosSemana) * 100))
      : 0
    const pctDietaSemana = totalComidasSemana > 0
      ? Math.min(100, Math.round((dietaCompletadaSemana / totalComidasSemana) * 100))
      : 0

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

    res.json({
      racha,
      semana,
      semanal: {
        rutina: {
          completados: rutinaCompletadaSemana,
          total: totalEjerciciosSemana,
          porcentaje: pctRutinaSemana,
        },
        dieta: {
          completados: dietaCompletadaSemana,
          total: totalComidasSemana,
          porcentaje: pctDietaSemana,
        },
      },
    })
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

export const enviarAvancePorEmail = async (req, res) => {
  const dias = Number(req.body?.dias || 7)
  if (!Number.isInteger(dias) || dias < 1 || dias > 60) {
    return res.status(400).json({ error: 'La cantidad de días debe estar entre 1 y 60' })
  }

  try {
    const result = await sendProgressReportToProfessionals(req.user.id, dias)
    if (result.sent === 0) {
      return res.status(400).json({ error: 'No tenés profesionales asignados para enviar el avance' })
    }
    res.json({
      message: `Avance enviado a la casilla de ${result.sent} profesional${result.sent === 1 ? '' : 'es'}`,
      ...result,
    })
  } catch (err) {
    console.error('enviarAvancePorEmail:', err)
    res.status(500).json({ error: 'Error al enviar avance por email' })
  }
}

export const enviarRecordatoriosInactividad = async (req, res) => {
  const dias = Number(req.body?.dias || process.env.ACTIVITY_REMINDER_DAYS || 4)
  if (!Number.isInteger(dias) || dias < 1 || dias > 30) {
    return res.status(400).json({ error: 'La cantidad de días debe estar entre 1 y 30' })
  }

  try {
    const result = await sendInactivityReminders(dias)
    res.json({
      message: result.devMode
        ? `Recordatorios generados en modo desarrollo: ${result.sent}. Configurá SMTP para enviarlos por mail.`
        : `Recordatorios enviados: ${result.sent}`,
      ...result,
    })
  } catch (err) {
    console.error('enviarRecordatoriosInactividad:', err)
    res.status(500).json({ error: 'Error al enviar recordatorios' })
  }
}

export const enviarRecordatorioProgreso = async (req, res) => {
  const usuarioId = Number(req.body?.usuario_id)
  if (!usuarioId) {
    return res.status(400).json({ error: 'Usuario requerido' })
  }
  if (!['entrenador', 'nutricionista'].includes(req.user.rol)) {
    return res.status(403).json({ error: 'Solo profesionales pueden enviar recordatorios' })
  }

  try {
    const vinculo = await prisma.vinculo.findFirst({
      where: {
        usuario_id: usuarioId,
        profesional_id: req.user.id,
        estado: 'activo',
      },
      include: {
        usuario: { select: { id_usuario: true, nombre_usuario: true, email: true } },
        profesional: { select: { id_usuario: true, nombre_usuario: true, rol: true } },
      },
    })

    if (!vinculo) {
      return res.status(404).json({ error: 'Alumno no encontrado o no vinculado' })
    }

    const notificacion = await prisma.notificacion.create({
      data: {
        destinatario_id: usuarioId,
        tipo: 'recordatorio_progreso',
        mensaje: `${vinculo.profesional.nombre_usuario} te recuerda que envíes tu progreso.`,
        data: {
          profesional_id: vinculo.profesional.id_usuario,
          profesional_nombre: vinculo.profesional.nombre_usuario,
          profesional_rol: vinculo.profesional.rol,
          usuario_id: vinculo.usuario.id_usuario,
          usuario_nombre: vinculo.usuario.nombre_usuario,
        },
      },
    })

    res.status(201).json({
      message: `Recordatorio enviado a ${vinculo.usuario.nombre_usuario}`,
      notificacion,
    })
  } catch (err) {
    console.error('enviarRecordatorioProgreso:', err)
    res.status(500).json({ error: 'Error al enviar recordatorio' })
  }
}
