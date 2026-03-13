const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { Resend } = require('resend')
const pool = require('../db/connection')

const resend = new Resend(process.env.RESEND_API_KEY)

const forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email) return res.status(400).json({ error: 'Email requerido' })

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email])

    // Responder siempre igual para no exponer si el email existe
    if (result.rows.length === 0) {
      return res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' })
    }

    const userId = result.rows[0].id
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    )

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    await resend.emails.send({
      from: 'Fitmi <onboarding@resend.dev>',
      to: email,
      subject: 'Restablecer contraseña',
      html: `
        <div style="background-color:#0a0a0a;min-height:100vh;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:0 auto;background-color:#111111;border-radius:12px;overflow:hidden;border:1px solid #1f1f1f;">

            <div style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #1f1f1f;">
              <svg width="40" height="40" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:12px;">
                <rect width="32" height="32" rx="6" fill="#000000"/>
                <rect x="7" y="14.5" width="18" height="3" rx="1" fill="#22c55e"/>
                <rect x="5" y="10" width="4" height="12" rx="2" fill="#22c55e"/>
                <rect x="9" y="11.5" width="2.5" height="9" rx="1" fill="#16a34a"/>
                <rect x="20.5" y="11.5" width="2.5" height="9" rx="1" fill="#16a34a"/>
                <rect x="23" y="10" width="4" height="12" rx="2" fill="#22c55e"/>
              </svg>
              <h1 style="color:#22c55e;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.5px;">Fitmi</h1>
            </div>

            <div style="padding:32px;">
              <h2 style="color:#ffffff;font-size:18px;font-weight:600;margin:0 0 12px;">Restablecer contraseña</h2>
              <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Recibiste este email porque solicitaste restablecer tu contraseña. El enlace es válido por <strong style="color:#ffffff;">1 hora</strong>.
              </p>
              <a href="${resetUrl}" style="display:block;background-color:#22c55e;color:#000000;text-decoration:none;text-align:center;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
                Restablecer contraseña
              </a>
              <p style="color:#52525b;font-size:12px;margin:24px 0 0;text-align:center;">
                Si no solicitaste esto, podés ignorar este email.
              </p>
            </div>

          </div>
        </div>
      `,
    })

    res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' })
  } catch (err) {
    console.error('Error en forgotPassword:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const resetPassword = async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) return res.status(400).json({ error: 'Token y password son requeridos' })

  try {
    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'El enlace es inválido o ya expiró' })
    }

    const { id: tokenId, user_id } = result.rows[0]
    const hash = await bcrypt.hash(password, 10)

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user_id])
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenId])

    res.json({ message: 'Contraseña actualizada correctamente' })
  } catch (err) {
    console.error('Error en resetPassword:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

module.exports = { forgotPassword, resetPassword }
