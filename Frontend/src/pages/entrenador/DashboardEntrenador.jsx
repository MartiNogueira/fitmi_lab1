import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/AppLayout'
import WelcomePopup from '../../components/WelcomePopup'

const today = new Date()
const dateLabel = today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

const recentActivity = [
  { initials: 'JR', name: 'Juan Rodriguez', action: 'Completó rutina de piernas', time: 'hace 20 min' },
  { initials: 'LP', name: 'Laura Perez', action: 'Nueva racha de 7 días', time: 'hace 1 hora' },
  { initials: 'CM', name: 'Carlos Méndez', action: 'Registró nuevo peso: 82 kg', time: 'hace 2 horas' },
  { initials: 'AG', name: 'Ana González', action: 'Completó rutina de hombros', time: 'hace 3 horas' },
]

const cardStyle = {
  border: '1px solid #111',
  borderRadius: '8px',
  backgroundColor: '#000',
  padding: '16px',
}

export default function DashboardEntrenador() {
  const { user } = useAuth()

  return (
    <AppLayout>
      <WelcomePopup userName={user?.name} userId={user?.id} />
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>
            Bienvenido, {user?.name}
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: '#666' }}>
            {dateLabel} · <span style={{ color: '#22c55e' }}>Panel Entrenador</span>
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 mb-6" style={{ border: '1px solid #111', borderRadius: '8px', overflow: 'hidden', maxWidth: '960px' }}>
          {[
            { value: '12', label: 'Alumnos', sub: 'activos' },
            { value: '8', label: 'Rutinas', sub: 'creadas' },
            { value: '3', label: 'Solicitudes', sub: 'pendientes' },
            { value: '5', label: 'Mensajes', sub: 'sin leer' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center py-4"
              style={{
                borderRight: i < 3 ? '1px solid #111' : 'none',
                backgroundColor: '#000',
              }}
            >
              <span className="text-2xl font-bold" style={{ color: '#fff' }}>{stat.value}</span>
              <span className="text-xs mt-0.5" style={{ color: '#aaa' }}>{stat.label}</span>
              <span className="text-xs" style={{ color: '#22c55e' }}>{stat.sub}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4" style={{ maxWidth: '960px' }}>

          <div className="flex flex-col gap-4 flex-1" style={{ minWidth: 0 }}>
            <div style={cardStyle}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#fff' }}>Actividad reciente</h2>
              <div className="flex flex-col gap-3">
                {recentActivity.map((item) => (
                  <div key={item.initials + item.time} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}
                    >
                      {item.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#22c55e' }}>{item.name}</p>
                      <p className="text-xs truncate" style={{ color: '#666' }}>{item.action}</p>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: '#444' }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#fff' }}>Alumnos inactivos</h2>
              <p className="text-xs mb-3" style={{ color: '#666' }}>Sin actividad en los últimos 3 días</p>
              <div className="flex flex-col gap-2">
                {[
                  { initials: 'MF', name: 'Marcos Fernández', days: '5 días sin entrenar' },
                  { initials: 'SR', name: 'Sofía Ramírez', days: '4 días sin entrenar' },
                ].map((a) => (
                  <div key={a.initials} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#1a0a0a', color: '#ef4444', border: '1px solid #ef444444' }}
                      >
                        {a.initials}
                      </div>
                      <span className="text-sm" style={{ color: '#ccc' }}>{a.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#ef4444' }}>{a.days}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="flex flex-col gap-4 lg:w-72 shrink-0"
            style={{ border: '1px solid #111', borderRadius: '8px', padding: '20px', backgroundColor: '#000', alignSelf: 'flex-start' }}
          >
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#333' }}>
              Resumen semanal
            </p>
            <div className="flex flex-col gap-5">
              {[
                { label: 'Entrenamientos completados', display: '34/60', pct: 57 },
                { label: 'Alumnos activos esta semana', display: '9/12', pct: 75 },
                { label: 'Rutinas asignadas', display: '8/12', pct: 67 },
              ].map((obj) => (
                <div key={obj.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: '#ccc' }}>{obj.label}</span>
                    <span className="text-sm font-medium" style={{ color: '#22c55e' }}>{obj.display}</span>
                  </div>
                  <div className="w-full rounded-full" style={{ height: '4px', backgroundColor: '#111' }}>
                    <div className="rounded-full" style={{ width: `${obj.pct}%`, height: '4px', backgroundColor: '#22c55e' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-4 mt-2" style={{ backgroundColor: '#0a0a0a', border: '1px solid #111' }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#444' }}>Rendimiento general</p>
              <p className="text-3xl font-bold" style={{ color: '#22c55e' }}>74%</p>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
