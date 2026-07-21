import nodemailer from 'nodemailer'
import { Resend } from 'resend'

let transporter
let resendClient

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

const getResendClient = () => {
  if (!resendConfigured()) return null
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

const sendWithResend = async (mail) => {
  const resend = getResendClient()
  const { data, error } = await resend.emails.send(mail)

  if (error) {
    throw new Error(error.message || 'Error al enviar email con Resend')
  }

  return {
    provider: 'resend',
    messageId: data?.id,
    accepted: Array.isArray(mail.to) ? mail.to : [mail.to],
    rejected: [],
  }
}

export const sendMail = async ({ to, subject, text, html, attachments }) => {
  const from =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'Fitmi <no-reply@fitmi.local>'
  const mail = { from, to, subject, text, html, attachments }

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
