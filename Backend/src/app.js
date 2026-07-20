import express from 'express'
import http from 'http'
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
import registrosRoutes from './routes/registros.routes.js'
import fotosRoutes from './routes/fotos.routes.js'
import { startActivityReminderJob, startProgressReportJob } from './services/progress-mail.service.js'
import authMiddleware from './middleware/auth.middleware.js'
import { desvincularMiVinculo } from './controllers/vinculo.controller.js'
import { initSocket } from './socket.js'

const app = express()
const server = http.createServer(app)
initSocket(server)

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(resolve(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/notificaciones', notificacionesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/planes', planesRoutes)
app.use('/api/rutinas', rutinasRoutes)
app.use('/api/progreso', progresoRoutes)
app.use('/api/vinculos', vinculoRoutes)
app.post('/api/vinculos/:id/desvincular', authMiddleware, desvincularMiVinculo)
app.use('/api/mensajes', mensajesRoutes)
app.use('/api/comunidades', comunidadesRoutes)
app.use('/api/registros', registrosRoutes)
app.use('/api/fotos', fotosRoutes)

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '127.0.0.1'
server.listen(PORT, HOST, () => {
  console.log(`Fitmi server corriendo en http://${HOST}:${PORT}`)
  console.log('Ruta activa: POST /api/vinculos/:id/desvincular')
  startActivityReminderJob()
  startProgressReportJob()
})
