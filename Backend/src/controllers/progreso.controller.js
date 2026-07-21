import prisma from '../db/prisma.js'
import {
  sendInactivityReminders,
  sendProgressReportToProfessionals,
} from '../services/progress-mail.service.js'
import { sendMail } from '../services/mail.service.js'

function hoyRango() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)
  return { hoy, manana }
}

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

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
  const { rutina_id, dia_numero, ejercicio_nombre, peso_kg, reps_realizadas, notas } = req.body
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
      // Si vienen datos de detalle, actualizar en vez de borrar
      if (peso_kg !== undefined || reps_realizadas !== undefined || notas !== undefined) {
        const updated = await prisma.ejercicioCompletado.update({
          where: { id: existing.id },
          data: {
            peso_kg: peso_kg ? Number(peso_kg) : existing.peso_kg,
            reps_realizadas: reps_realizadas ?? existing.reps_realizadas,
            notas: notas ?? existing.notas,
          },
        })
        return res.json({ completado: true, registro: updated })
      }
      await prisma.ejercicioCompletado.delete({ where: { id: existing.id } })
      return res.json({ completado: false })
    }
    const created = await prisma.ejercicioCompletado.create({
      data: {
        usuario_id: req.user.id,
        rutina_id: Number(rutina_id),
        dia_numero: Number(dia_numero),
        ejercicio_nombre,
        peso_kg: peso_kg ? Number(peso_kg) : null,
        reps_realizadas: reps_realizadas ?? null,
        notas: notas ?? null,
      },
    })
    res.json({ completado: true, registro: created })
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
  const { plan_id, dia_numero, comida_nombre, estado, gramos, descripcion_reemplazo } = req.body
  if (!plan_id || dia_numero == null || !comida_nombre) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }
  const estadoFinal = estado || 'completada'
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
      // Si viene un estado nuevo, actualizar
      if (estado) {
        const updated = await prisma.comidaCompletada.update({
          where: { id: existing.id },
          data: {
            estado: estadoFinal,
            gramos: gramos ? Number(gramos) : null,
            descripcion_reemplazo: descripcion_reemplazo ?? null,
          },
        })
        return res.json({ completado: true, registro: updated })
      }
      await prisma.comidaCompletada.delete({ where: { id: existing.id } })
      return res.json({ completado: false })
    }
    const created = await prisma.comidaCompletada.create({
      data: {
        usuario_id: req.user.id,
        plan_id: Number(plan_id),
        dia_numero: Number(dia_numero),
        comida_nombre,
        estado: estadoFinal,
        gramos: gramos ? Number(gramos) : null,
        descripcion_reemplazo: descripcion_reemplazo ?? null,
      },
    })
    res.json({ completado: true, registro: created })
  } catch (err) {
    console.error('toggleComida:', err)
    res.status(500).json({ error: 'Error al actualizar progreso' })
  }
}

// ── Progreso mensual (últimos 30 días) ───────────────────────────────────────

export const getProgresoMensual = async (req, res) => {
  try {
    const hoy = new Date()
    hoy.setHours(23, 59, 59, 999)
    const hace30 = new Date()
    hace30.setDate(hace30.getDate() - 30)
    hace30.setHours(0, 0, 0, 0)

    const [rutina, plan] = await Promise.all([
      prisma.rutina.findFirst({ where: { usuario_id: req.user.id }, orderBy: { created_at: 'desc' } }),
      prisma.planAlimenticio.findFirst({ where: { usuario_id: req.user.id }, orderBy: { created_at: 'desc' } }),
    ])

    const [ejerciciosCompletados, comidasCompletadas, pesosCorporales] = await Promise.all([
      rutina ? prisma.ejercicioCompletado.findMany({
        where: { usuario_id: req.user.id, rutina_id: rutina.id, fecha: { gte: hace30, lte: hoy } },
      }) : [],
      plan ? prisma.comidaCompletada.findMany({
        where: { usuario_id: req.user.id, plan_id: plan.id, fecha: { gte: hace30, lte: hoy } },
      }) : [],
      prisma.pesoCorporal.findMany({
        where: { usuario_id: req.user.id, fecha: { gte: hace30, lte: hoy } },
        orderBy: { fecha: 'asc' },
      }),
    ])

    const totalEjerciciosPorDia = {}
    const totalComidasPorDia = {}
    if (rutina?.ejercicios) {
      rutina.ejercicios.forEach(d => {
        totalEjerciciosPorDia[d.dia] = d.ejercicios?.length ?? 0
      })
    }
    if (plan?.dias) {
      plan.dias.forEach(d => {
        totalComidasPorDia[d.dia] = d.comidas?.length ?? 0
      })
    }

    const diasMap = {}
    for (let i = 0; i <= 30; i++) {
      const d = new Date(hace30)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      diasMap[key] = { fecha: key, ejercicios_completados: 0, ejercicios_totales: 0, comidas_completadas: 0, comidas_omitidas: 0, comidas_totales: 0 }
    }

    ejerciciosCompletados.forEach(e => {
      const key = new Date(e.fecha).toISOString().split('T')[0]
      if (diasMap[key]) diasMap[key].ejercicios_completados++
    })

    comidasCompletadas.forEach(c => {
      const key = new Date(c.fecha).toISOString().split('T')[0]
      if (diasMap[key]) {
        if (c.estado === 'omitida') diasMap[key].comidas_omitidas++
        else diasMap[key].comidas_completadas++
      }
    })

    Object.values(diasMap).forEach(d => {
      const dayOfWeek = ((new Date(d.fecha).getDay() + 6) % 7) + 1
      d.ejercicios_totales = totalEjerciciosPorDia[dayOfWeek] ?? 0
      d.comidas_totales = totalComidasPorDia[dayOfWeek] ?? (plan ? Object.values(totalComidasPorDia)[0] ?? 0 : 0)
    })

    const ejercicioMap = {}
    ejerciciosCompletados.forEach(e => {
      if (!ejercicioMap[e.ejercicio_nombre]) ejercicioMap[e.ejercicio_nombre] = []
      ejercicioMap[e.ejercicio_nombre].push({
        fecha: new Date(e.fecha).toISOString().split('T')[0],
        peso_kg: e.peso_kg,
        reps_realizadas: e.reps_realizadas,
      })
    })
    const progresionEjercicios = Object.entries(ejercicioMap).map(([nombre, registros]) => ({
      nombre,
      registros: registros.sort((a, b) => a.fecha.localeCompare(b.fecha)),
    }))

    res.json({
      dias: Object.values(diasMap),
      pesosCorporales,
      progresionEjercicios,
    })
  } catch (err) {
    console.error('getProgresoMensual:', err)
    res.status(500).json({ error: 'Error al obtener progreso mensual' })
  }
}

// ── Historial por fecha ───────────────────────────────────────────────────────

export const getHistorialFecha = async (req, res) => {
  const { fecha } = req.params
  try {
    const dia = new Date(fecha)
    dia.setHours(0, 0, 0, 0)
    const diaSiguiente = new Date(dia)
    diaSiguiente.setDate(diaSiguiente.getDate() + 1)

    const [ejercicios, comidas] = await Promise.all([
      prisma.ejercicioCompletado.findMany({
        where: { usuario_id: req.user.id, fecha: { gte: dia, lt: diaSiguiente } },
        orderBy: { ejercicio_nombre: 'asc' },
      }),
      prisma.comidaCompletada.findMany({
        where: { usuario_id: req.user.id, fecha: { gte: dia, lt: diaSiguiente } },
        orderBy: { comida_nombre: 'asc' },
      }),
    ])

    res.json({ fecha, ejercicios, comidas })
  } catch (err) {
    console.error('getHistorialFecha:', err)
    res.status(500).json({ error: 'Error al obtener historial' })
  }
}

// ── Envío de avances y recordatorios (email / notificación) ──────────────────

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
      message: result.devMode
        ? `Avance generado en modo desarrollo para ${result.sent} profesional${result.sent === 1 ? '' : 'es'}. Configurá SMTP para enviarlo por mail real.`
        : `Avance enviado a la casilla de ${result.sent} profesional${result.sent === 1 ? '' : 'es'}`,
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
    if (!vinculo.usuario.email) {
      return res.status(400).json({ error: 'El alumno no tiene email configurado' })
    }

    const subject = 'Recordatorio para cargar tu progreso en Fitmi'
    const text = [
      `Hola ${vinculo.usuario.nombre_usuario},`,
      '',
      `${vinculo.profesional.nombre_usuario} te recuerda que cargues tu progreso en Fitmi.`,
      'Registrá tus entrenamientos o comidas para que pueda hacer seguimiento de tu evolución.',
      '',
      'Fitmi',
    ].join('\n')
    const html = [
      `<p>Hola ${escapeHtml(vinculo.usuario.nombre_usuario)},</p>`,
      `<p><strong>${escapeHtml(vinculo.profesional.nombre_usuario)}</strong> te recuerda que cargues tu progreso en Fitmi.</p>`,
      '<p>Registrá tus entrenamientos o comidas para que pueda hacer seguimiento de tu evolución.</p>',
      '<p>Fitmi</p>',
    ].join('\n')
    const delivery = await sendMail({
      to: vinculo.usuario.email,
      subject,
      text,
      html,
    })

    await prisma.emailLog.create({
      data: {
        tipo: 'recordatorio_progreso',
        usuario_id: vinculo.usuario.id_usuario,
        destinatario: vinculo.usuario.email,
        asunto: subject,
      },
    })

    res.status(201).json({
      message: delivery.dev
        ? `Recordatorio generado en modo desarrollo para ${vinculo.usuario.nombre_usuario}. Configurá SMTP para enviarlo por mail.`
        : `Recordatorio enviado por mail a ${vinculo.usuario.nombre_usuario}`,
      devMode: Boolean(delivery.dev),
    })
  } catch (err) {
    console.error('enviarRecordatorioProgreso:', err)
    res.status(500).json({ error: 'Error al enviar recordatorio' })
  }
}
