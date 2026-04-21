import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()
import * as dbConnection from './db/connection.js'

import authRoutes from './routes/auth.routes.js';
import notificacionesRoutes from './routes/notificaciones.routes.js';
import adminRoutes from './routes/admin.routes.js';
import planesRoutes from './routes/planes.routes.js';
import rutinasRoutes from './routes/rutinas.routes.js';

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/notificaciones', notificacionesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/planes', planesRoutes)
app.use('/api/rutinas', rutinasRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Fitmi server corriendo en puerto ${PORT}`))

// error handler generico