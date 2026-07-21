import nodemailer from 'nodemailer'

let transporter

const resendConfigured = () => Boolean(process.env.RESEND_API_KEY)

const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS)

const getTransporter = () => {
  if (!smtpConfigured()) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

const sendWithResend = async (mail) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'fitmi-backend',
    },
    body: JSON.stringify(mail),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.message || data?.error || `Resend error ${response.status}`
    throw new Error(message)
  }

  return {
    provider: 'resend',
    messageId: data.id,
    accepted: Array.isArray(mail.to) ? mail.to : [mail.to],
    rejected: [],
  }
}

export const sendMail = async ({ to, subject, text, html }) => {
  const from =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'Fitmi <no-reply@fitmi.local>'
  const mail = { from, to, subject, text, html }

  if (resendConfigured()) {
    return sendWithResend(mail)
  }

  const smtpTransporter = getTransporter()

  if (!smtpTransporter) {
    console.log('[mail:dev]', mail)
    return { dev: true, messageId: `dev-${Date.now()}` }
  }

  return smtpTransporter.sendMail(mail)
}
