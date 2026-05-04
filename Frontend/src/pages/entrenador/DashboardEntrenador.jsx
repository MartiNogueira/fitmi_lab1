import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/AppLayout'
import WelcomePopup from '../../components/WelcomePopup'
import { getMisClientes, getRutinas, getSolicitudesVinculo, getMensajesNoLeidos } from '../../api/auth'

const dateLabel = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const cardStyle = { border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000', padding: '16px' }

export default function DashboardEntrenador() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ alumnos: '-', rutinas: '-', solicitudes: '-', mensajes: '-' })
  const [alumnos, setAlumnos] = useState([])
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMisClientes(),
      getRutinas(),
      getSolicitudesVinculo(),
      getMensajesNoLeidos(),
    ]).then(([cl, ru, so, ms]) => {
      setAlumnos(cl.data)
      setRutinas(ru.data)
      setStats({
        alumnos: cl.data.length,
        rutinas: ru.data.length,
        solicitudes: so.data.length,
        mensajes: ms.data.count,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const rutinaDeAlumno = (email) =>
    rutinas.find(r => r.usuario?.email === email)

  return (
    <AppLayout>
      <WelcomePopup userName={user?.name} userId={user?.id} />
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Bienvenido, {user?.name}</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: '#666' }}>
            {dateLabel} · <span style={{ color: '#22c55e' }}>Panel Entrenador</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 mb-6" style={{ border: '1px solid #111', borderRadius: '8px', overflow: 'hidden', maxWidth: '960px' }}>
          {[
            { value: stats.alumnos, label: 'Alumnos', sub: 'activos' },
            { value: stats.rutinas, label: 'Rutinas', sub: 'creadas' },
            { value: stats.solicitudes, label: 'Solicitudes', sub: 'pendientes' },
            { value: stats.mensajes, label: 'Mensajes', sub: 'sin leer' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex flex-col items-center py-4"
              style={{ borderRight: i < 3 ? '1px solid #111' : 'none', backgroundColor: '#000' }}>
              <span className="text-2xl font-bold" style={{ color: '#fff' }}>{stat.value}</span>
              <span className="text-xs mt-0.5" style={{ color: '#aaa' }}>{stat.label}</span>
              <span className="text-xs" style={{ color: '#22c55e' }}>{stat.sub}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4" style={{ maxWidth: '960px' }}>

          {/* Alumnos */}
          <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#fff' }}>Mis alumnos</h2>
            {loading ? (
              <p className="text-xs" style={{ color: '#444' }}>Cargando...</p>
            ) : alumnos.length === 0 ? (
              <p className="text-xs" style={{ color: '#444' }}>Todavía no tenés alumnos vinculados.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {alumnos.map((a) => {
                  const rutina = rutinaDeAlumno(a.email)
                  return (
                    <div key={a.id_usuario} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        {initials(a.nombre_usuario)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: '#fff' }}>{a.nombre_usuario}</p>
                        <p className="text-xs truncate" style={{ color: '#555' }}>
                          {rutina ? `Rutina: ${rutina.nombre}` : 'Sin rutina asignada'}
                        </p>
                      </div>
                      <button onClick={() => navigate(`/chat/${a.id_usuario}`, { state: { nombre: a.nombre_usuario } })}
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#111', border: '1px solid #1a1a1a' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Rutinas */}
          <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#fff' }}>Rutinas recientes</h2>
            {loading ? (
              <p className="text-xs" style={{ color: '#444' }}>Cargando...</p>
            ) : rutinas.length === 0 ? (
              <p className="text-xs" style={{ color: '#444' }}>No creaste rutinas todavía.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {rutinas.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#fff' }}>{r.nombre}</p>
                      <p className="text-xs" style={{ color: '#555' }}>
                        {r.usuario ? r.usuario.nombre_usuario : 'Sin asignar'} · {r.dias_semana} días/sem
                      </p>
                    </div>
                    {r.usuario && (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 ml-2"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e33' }}>
                        Asignada
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
