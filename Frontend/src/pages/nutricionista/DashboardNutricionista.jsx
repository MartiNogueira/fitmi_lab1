import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/AppLayout'
import WelcomePopup from '../../components/WelcomePopup'
import { getMisClientes, getNotificaciones, getPlanes, getSolicitudesVinculo } from '../../api/auth'

const dateLabel = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const cardStyle = { border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000', padding: '16px' }

export default function DashboardNutricionista() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pacientes: '-', planes: '-', solicitudes: '-', avances: '-' })
  const [pacientes, setPacientes] = useState([])
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMisClientes(),
      getPlanes(),
      getSolicitudesVinculo(),
      getNotificaciones(),
    ]).then(([pa, pl, so, no]) => {
      const avancesNuevos = no.data.filter((item) => item.tipo === 'reporte_avance' && !item.leida).length
      setPacientes(pa.data)
      setPlanes(pl.data)
      setStats({
        pacientes: pa.data.length,
        planes: pl.data.length,
        solicitudes: so.data.length,
        avances: avancesNuevos,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const planDePaciente = (email) =>
    planes.find(p => p.usuario?.email === email)

  return (
    <AppLayout>
      <WelcomePopup userName={user?.name} userId={user?.id} />
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Bienvenido, {user?.name}</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: '#666' }}>
            {dateLabel} · <span style={{ color: '#22c55e' }}>Panel Nutricionista</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 mb-6" style={{ border: '1px solid #111', borderRadius: '8px', overflow: 'hidden', maxWidth: '960px' }}>
          {[
            { value: stats.pacientes, label: 'Pacientes', sub: 'activos' },
            { value: stats.planes, label: 'Planes', sub: 'creados' },
            { value: stats.solicitudes, label: 'Solicitudes', sub: 'pendientes' },
            { value: stats.avances, label: 'Avances', sub: 'nuevos' },
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

          {/* Pacientes */}
          <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#fff' }}>Mis pacientes</h2>
            {loading ? (
              <p className="text-xs" style={{ color: '#444' }}>Cargando...</p>
            ) : pacientes.length === 0 ? (
              <p className="text-xs" style={{ color: '#444' }}>Todavía no tenés pacientes vinculados.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pacientes.map((p) => {
                  const plan = planDePaciente(p.email)
                  return (
                    <div key={p.id_usuario} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        {initials(p.nombre_usuario)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: '#fff' }}>{p.nombre_usuario}</p>
                        <p className="text-xs truncate" style={{ color: '#555' }}>
                          {plan ? `Plan: ${plan.nombre}` : 'Sin plan asignado'}
                        </p>
                      </div>
                      <button onClick={() => navigate(`/chat/${p.id_usuario}`, { state: { nombre: p.nombre_usuario } })}
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

          {/* Planes */}
          <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#fff' }}>Planes recientes</h2>
            {loading ? (
              <p className="text-xs" style={{ color: '#444' }}>Cargando...</p>
            ) : planes.length === 0 ? (
              <p className="text-xs" style={{ color: '#444' }}>No creaste planes todavía.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {planes.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#fff' }}>{p.nombre}</p>
                      <p className="text-xs" style={{ color: '#555' }}>
                        {p.usuario ? p.usuario.nombre_usuario : 'Sin asignar'} · {p.dias?.length ?? 0} días
                      </p>
                    </div>
                    {p.usuario && (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 ml-2"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e33' }}>
                        Asignado
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
