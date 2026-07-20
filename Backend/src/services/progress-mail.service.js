import nodemailer from 'nodemailer'
import prisma from '../db/prisma.js'

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

async function sendMail({ to, subject, html }) {
  const transporter = createTransporter()
  if (!transporter) {
    console.log(`[mail] SMTP no configurado — no se envió mail a ${to}`)
    return false
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Fitmi <no-reply@fitmi.local>',
    to,
    subject,
    html,
  })
  return true
}

// Envía el resumen de progreso del cliente a sus profesionales vinculados
export async function sendProgressReportToProfessionals(usuarioId, dias = 7) {
  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: usuarioId },
    select: { nombre_usuario: true, email: true },
  })
  if (!usuario) return { sent: 0 }

  const vinculos = await prisma.vinculo.findMany({
    where: { usuario_id: usuarioId, estado: 'activo' },
    include: { profesional: { select: { nombre_usuario: true, email: true } } },
  })
  if (vinculos.length === 0) return { sent: 0 }

  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  const ejercicios = await prisma.ejercicioCompletado.count({
    where: { usuario_id: usuarioId, fecha: { gte: desde } },
  })
  const comidas = await prisma.comidaCompletada.count({
    where: { usuario_id: usuarioId, fecha: { gte: desde } },
  })

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto">
      <h2 style="color:#22c55e">Avance de ${usuario.nombre_usuario}</h2>
      <p>Resumen de los últimos <strong>${dias} días</strong>:</p>
      <ul>
        <li>🏋️ Ejercicios completados: <strong>${ejercicios}</strong></li>
        <li>🥗 Comidas registradas: <strong>${comidas}</strong></li>
      </ul>
      <p style="color:#888;font-size:12px">Enviado desde Fitmi</p>
    </div>
  `

  let sent = 0
  for (const v of vinculos) {
    const ok = await sendMail({
      to: v.profesional.email,
      subject: `Avance de ${usuario.nombre_usuario} — últimos ${dias} días`,
      html,
    })
    if (ok) sent++
  }
  return { sent }
}

// Busca usuarios inactivos y les manda un recordatorio
export async function sendInactivityReminders(dias = 4) {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  const usuariosActivos = await prisma.usuario.findMany({
    where: { rol: 'cliente' },
    select: { id_usuario: true, nombre_usuario: true, email: true },
  })

  const inactivos = []
  for (const u of usuariosActivos) {
    const count = await prisma.ejercicioCompletado.count({
      where: { usuario_id: u.id_usuario, fecha: { gte: desde } },
    })
    if (count === 0) inactivos.push(u)
  }

  const html = (nombre) => `
    <div style="font-family:sans-serif;max-width:500px;margin:auto">
      <h2 style="color:#22c55e">¡Hola ${nombre}!</h2>
      <p>Hace más de <strong>${dias} días</strong> que no registrás actividad en Fitmi.</p>
      <p>¡Entrá y seguí con tu rutina! Cada día cuenta. 💪</p>
      <p style="color:#888;font-size:12px">Enviado desde Fitmi</p>
    </div>
  `

  let sent = 0
  const devMode = !createTransporter()
  for (const u of inactivos) {
    if (devMode) {
      console.log(`[mail] Recordatorio de inactividad para ${u.email}`)
      sent++
    } else {
      const ok = await sendMail({
        to: u.email,
        subject: '¡Te extrañamos en Fitmi! 💪',
        html: html(u.nombre_usuario),
      })
      if (ok) sent++
    }
  }
  return { sent, devMode, inactivos: inactivos.length }
}

// Cronjob: verifica inactividad cada N horas
export function startActivityReminderJob() {
  const enabled = process.env.ENABLE_ACTIVITY_REMINDERS === 'true'
  if (!enabled) {
    console.log('[mail] Recordatorios de inactividad desactivados (ENABLE_ACTIVITY_REMINDERS=false)')
    return
  }

  const intervalHours = Number(process.env.ACTIVITY_REMINDER_INTERVAL_HOURS) || 24
  const dias = Number(process.env.ACTIVITY_REMINDER_DAYS) || 4

  console.log(`[mail] Recordatorios de inactividad activos: cada ${intervalHours}h, umbral ${dias} días`)

  setInterval(async () => {
    try {
      const result = await sendInactivityReminders(dias)
      console.log(`[mail] Recordatorios enviados: ${result.sent}`)
    } catch (err) {
      console.error('[mail] Error en recordatorio automático:', err)
    }
  }, intervalHours * 60 * 60 * 1000)
}