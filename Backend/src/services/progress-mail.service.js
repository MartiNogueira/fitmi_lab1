import prisma from '../db/prisma.js'
import { sendMail } from './mail.service.js'

const DEFAULT_REPORT_DAYS = 7
const DEFAULT_INACTIVITY_DAYS = 4
const DAY_MS = 24 * 60 * 60 * 1000

const startOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const daysAgo = (days) => {
  const date = startOfToday()
  date.setDate(date.getDate() - days)
  return date
}

const formatDate = (date) =>
  new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const listText = (items, mapper, emptyText) => {
  if (items.length === 0) return emptyText
  return items.map(mapper).join('\n')
}

const listHtml = (items, mapper, emptyText) => {
  if (items.length === 0) return `<p>${escapeHtml(emptyText)}</p>`
  return `<ul>${items.map((item) => `<li>${mapper(item)}</li>`).join('')}</ul>`
}

export const buildProgressSummary = async (usuarioId, days = DEFAULT_REPORT_DAYS) => {
  const since = daysAgo(days)
  const user = await prisma.usuario.findUnique({
    where: { id_usuario: Number(usuarioId) },
    select: { id_usuario: true, nombre_usuario: true, email: true },
  })

  if (!user) {
    throw new Error('Usuario no encontrado')
  }

  const [ejercicios, comidas, vinculos, rutinaAsignada, planAsignado] = await Promise.all([
    prisma.ejercicioCompletado.findMany({
      where: { usuario_id: user.id_usuario, fecha: { gte: since } },
      include: { rutina: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
    }),
    prisma.comidaCompletada.findMany({
      where: { usuario_id: user.id_usuario, fecha: { gte: since } },
      include: { plan: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
    }),
    prisma.vinculo.findMany({
      where: { usuario_id: user.id_usuario, estado: 'activo' },
      include: { profesional: { select: { id_usuario: true, nombre_usuario: true, email: true, rol: true } } },
    }),
    prisma.rutina.findFirst({
      where: { usuario_id: user.id_usuario },
      orderBy: { created_at: 'desc' },
      select: { id: true, nombre: true, ejercicios: true },
    }),
    prisma.planAlimenticio.findFirst({
      where: { usuario_id: user.id_usuario },
      orderBy: { created_at: 'desc' },
      select: { id: true, nombre: true, dias: true },
    }),
  ])

  return {
    user,
    days,
    since,
    ejercicios,
    comidas,
    vinculos,
    rutinaAsignada,
    planAsignado,
  }
}

const buildProgressEmail = ({ user, days, ejercicios, comidas }, tipo) => {
  const subject = `Avances de ${user.nombre_usuario} en Fitmi`
  const includeEjercicios = tipo === 'entrenador' || tipo === 'admin'
  const includeComidas = tipo === 'nutricionista' || tipo === 'admin'

  const textSections = [
    `Hola,`,
    `${user.nombre_usuario} compartió sus avances cargados en Fitmi durante los últimos ${days} días.`,
  ]

  const htmlSections = [
    '<p>Hola,</p>',
    `<p><strong>${escapeHtml(user.nombre_usuario)}</strong> compartió sus avances cargados en Fitmi durante los últimos ${days} días.</p>`,
  ]

  if (includeEjercicios) {
    textSections.push(
      '',
      `Entrenamiento: ${ejercicios.length} ejercicios completados.`,
      listText(
        ejercicios.slice(0, 20),
        (item) => `- ${item.ejercicio_nombre} (${item.rutina?.nombre || 'Rutina'}) - ${formatDate(item.fecha)}`,
        'No hay ejercicios cargados en este período.'
      )
    )
    htmlSections.push(
      `<h2>Entrenamiento: ${ejercicios.length} ejercicios completados</h2>`,
      listHtml(
        ejercicios.slice(0, 20),
        (item) => `${escapeHtml(item.ejercicio_nombre)} (${escapeHtml(item.rutina?.nombre || 'Rutina')}) - ${escapeHtml(formatDate(item.fecha))}`,
        'No hay ejercicios cargados en este período.'
      )
    )
  }

  if (includeComidas) {
    textSections.push(
      '',
      `Alimentación: ${comidas.length} comidas completadas.`,
      listText(
        comidas.slice(0, 20),
        (item) => `- ${item.comida_nombre} (${item.plan?.nombre || 'Plan'}) - ${formatDate(item.fecha)}`,
        'No hay comidas cargadas en este período.'
      )
    )
    htmlSections.push(
      `<h2>Alimentación: ${comidas.length} comidas completadas</h2>`,
      listHtml(
        comidas.slice(0, 20),
        (item) => `${escapeHtml(item.comida_nombre)} (${escapeHtml(item.plan?.nombre || 'Plan')}) - ${escapeHtml(formatDate(item.fecha))}`,
        'No hay comidas cargadas en este período.'
      )
    )
  }

  textSections.push('', 'Fitmi')
  htmlSections.push('<p>Fitmi</p>')

  return {
    subject,
    text: textSections.join('\n'),
    html: htmlSections.join('\n'),
  }
}

export const sendProgressReportToProfessionals = async (usuarioId, days = DEFAULT_REPORT_DAYS) => {
  const summary = await buildProgressSummary(usuarioId, days)
  const activeProfessionals = summary.vinculos
    .map((vinculo) => ({ tipo: vinculo.tipo, profesional: vinculo.profesional }))
    .filter(({ profesional }) => profesional?.email)

  if (activeProfessionals.length === 0) {
    return { sent: 0, recipients: [] }
  }

  const recipients = []
  let devMode = false
  for (const { tipo, profesional } of activeProfessionals) {
    const email = buildProgressEmail(summary, tipo)
    const delivery = await sendMail({
      to: profesional.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    })
    if (delivery.dev) devMode = true
    await prisma.emailLog.create({
      data: {
        tipo: 'reporte_avance',
        usuario_id: summary.user.id_usuario,
        destinatario: profesional.email,
        asunto: email.subject,
      },
    })
    recipients.push({ id: profesional.id_usuario, email: profesional.email, tipo })
  }

  return { sent: recipients.length, recipients, devMode }
}

export const sendAutomaticProgressReports = async (days = DEFAULT_REPORT_DAYS) => {
  const today = startOfToday()
  const vinculos = await prisma.vinculo.findMany({
    where: {
      estado: 'activo',
      usuario: { rol: 'cliente', estado: 'aprobado' },
      profesional: { email: { not: '' } },
    },
    select: { usuario_id: true },
    distinct: ['usuario_id'],
  })

  const results = []
  let sent = 0
  let devMode = false

  for (const vinculo of vinculos) {
    const alreadySentToday = await prisma.emailLog.findFirst({
      where: {
        tipo: 'reporte_avance_auto',
        usuario_id: vinculo.usuario_id,
        created_at: { gte: today },
      },
    })
    if (alreadySentToday) continue

    const result = await sendProgressReportToProfessionals(vinculo.usuario_id, days)
    if (result.devMode) devMode = true
    sent += result.sent
    results.push({ usuario_id: vinculo.usuario_id, ...result })

    if (result.sent > 0) {
      await prisma.emailLog.create({
        data: {
          tipo: 'reporte_avance_auto',
          usuario_id: vinculo.usuario_id,
          destinatario: result.recipients.map((recipient) => recipient.email).join(', '),
          asunto: `Reporte automático de avance (${days} días)`,
        },
      })
    }
  }

  return { sent, users: results.length, results, devMode }
}

const getLastActivityDate = async (usuarioId) => {
  const [lastExercise, lastFood] = await Promise.all([
    prisma.ejercicioCompletado.aggregate({
      where: { usuario_id: usuarioId },
      _max: { fecha: true },
    }),
    prisma.comidaCompletada.aggregate({
      where: { usuario_id: usuarioId },
      _max: { fecha: true },
    }),
  ])

  const dates = [lastExercise._max.fecha, lastFood._max.fecha].filter(Boolean).map((date) => new Date(date))
  if (dates.length === 0) return null
  return new Date(Math.max(...dates.map((date) => date.getTime())))
}

const buildReminderEmail = (user, days, lastActivityDate) => {
  const subject = 'Recordatorio de actividad en Fitmi'
  const lastActivityText = lastActivityDate
    ? `Tu última actividad registrada fue el ${formatDate(lastActivityDate)}.`
    : 'Todavía no registraste actividad.'

  return {
    subject,
    text: [
      `Hola ${user.nombre_usuario},`,
      '',
      `Hace ${days} días o más que no cargás actividad en Fitmi.`,
      lastActivityText,
      'Entrá a la app y registrá tu entrenamiento o alimentación para mantener tu progreso actualizado.',
      '',
      'Fitmi',
    ].join('\n'),
    html: [
      `<p>Hola ${escapeHtml(user.nombre_usuario)},</p>`,
      `<p>Hace ${days} días o más que no cargás actividad en Fitmi.</p>`,
      `<p>${escapeHtml(lastActivityText)}</p>`,
      '<p>Entrá a la app y registrá tu entrenamiento o alimentación para mantener tu progreso actualizado.</p>',
      '<p>Fitmi</p>',
    ].join('\n'),
  }
}

export const sendInactivityReminders = async (days = DEFAULT_INACTIVITY_DAYS) => {
  const cutoff = new Date(Date.now() - Number(days) * DAY_MS)
  const today = startOfToday()
  const users = await prisma.usuario.findMany({
    where: { rol: 'cliente', estado: 'aprobado', email: { not: '' } },
    select: { id_usuario: true, nombre_usuario: true, email: true, created_at: true },
  })

  const recipients = []
  let devMode = false
  for (const user of users) {
    const lastActivityDate = await getLastActivityDate(user.id_usuario)
    const baselineDate = lastActivityDate || user.created_at
    if (new Date(baselineDate) > cutoff) continue

    const alreadySentToday = await prisma.emailLog.findFirst({
      where: {
        tipo: 'recordatorio_inactividad',
        usuario_id: user.id_usuario,
        created_at: { gte: today },
      },
    })
    if (alreadySentToday) continue

    const email = buildReminderEmail(user, days, lastActivityDate)
    const delivery = await sendMail({
      to: user.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    })
    if (delivery.dev) devMode = true
    await prisma.emailLog.create({
      data: {
        tipo: 'recordatorio_inactividad',
        usuario_id: user.id_usuario,
        destinatario: user.email,
        asunto: email.subject,
      },
    })
    recipients.push({ id: user.id_usuario, email: user.email })
  }

  return { sent: recipients.length, recipients, devMode }
}

export const startActivityReminderJob = () => {
  if (process.env.ENABLE_ACTIVITY_REMINDERS !== 'true') return

  const days = Number(process.env.ACTIVITY_REMINDER_DAYS || DEFAULT_INACTIVITY_DAYS)
  const intervalHours = Number(process.env.ACTIVITY_REMINDER_INTERVAL_HOURS || 24)
  const run = async () => {
    try {
      const result = await sendInactivityReminders(days)
      console.log(`[recordatorios] enviados: ${result.sent}`)
    } catch (err) {
      console.error('[recordatorios] error:', err)
    }
  }

  setTimeout(run, 10_000)
  setInterval(run, intervalHours * 60 * 60 * 1000)
}

export const startProgressReportJob = () => {
  if (process.env.ENABLE_PROGRESS_REPORTS !== 'true') return

  const days = Number(process.env.PROGRESS_REPORT_DAYS || DEFAULT_REPORT_DAYS)
  const intervalHours = Number(process.env.PROGRESS_REPORT_INTERVAL_HOURS || 24)
  const run = async () => {
    try {
      const result = await sendAutomaticProgressReports(days)
      console.log(`[reportes de avance] enviados: ${result.sent}`)
    } catch (err) {
      console.error('[reportes de avance] error:', err)
    }
  }

  setTimeout(run, 20_000)
  setInterval(run, intervalHours * 60 * 60 * 1000)
}
