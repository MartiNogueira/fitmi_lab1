import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })
import * as dbConnection from './db/connection.js'

import authRoutes from './routes/auth.routes.js'
import notificacionesRoutes from './routes/notificaciones.routes.js'
import adminRoutes from './routes/admin.routes.js'
import planesRoutes from './routes/planes.routes.js'
import rutinasRoutes from './routes/rutinas.routes.js'
import progresoRoutes from './routes/progreso.routes.js'
import vinculoRoutes from './routes/vinculo.routes.js'
import mensajesRoutes from './routes/mensajes.routes.js'
import comunidadesRoutes from './routes/comunidades.routes.js'
import { startActivityReminderJob } from './services/progress-mail.service.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/notificaciones', notificacionesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/planes', planesRoutes)
app.use('/api/rutinas', rutinasRoutes)
app.use('/api/progreso', progresoRoutes)
app.use('/api/vinculos', vinculoRoutes)
app.use('/api/mensajes', mensajesRoutes)
app.use('/api/comunidades', comunidadesRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Fitmi server corriendo en puerto ${PORT}`)
  startActivityReminderJob()
})
