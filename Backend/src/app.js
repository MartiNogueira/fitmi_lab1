const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('./db/connection')

const authRoutes = require('./routes/auth.routes')
const notificacionesRoutes = require('./routes/notificaciones.routes')
const adminRoutes = require('./routes/admin.routes')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/notificaciones', notificacionesRoutes)
app.use('/api/admin', adminRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Fitmi server corriendo en puerto ${PORT}`))
