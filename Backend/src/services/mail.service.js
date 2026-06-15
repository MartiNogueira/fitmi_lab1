import nodemailer from 'nodemailer'

let transporter

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

export const sendMail = async ({ to, subject, text, html }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'Fitmi <no-reply@fitmi.local>'
  const mail = { from, to, subject, text, html }
  const smtpTransporter = getTransporter()

  if (!smtpTransporter) {
    console.log('[mail:dev]', mail)
    return { dev: true, messageId: `dev-${Date.now()}` }
  }

  return smtpTransporter.sendMail(mail)
}
