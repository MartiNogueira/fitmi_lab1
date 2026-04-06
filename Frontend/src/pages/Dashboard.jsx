import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'
import WelcomePopup from '../components/WelcomePopup'

const today = new Date()
const dateLabel = today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const muscleGroup = 'Espalda y Bíceps'

const weekDays = ['L', 'M', 'MI', 'J', 'V', 'S', 'D']
const completedDays = [0, 1, 3]
const todayIndex = 2

const exercises = [
  { name: 'Dominadas', sets: '4 × 8 reps', badge: 'Espalda' },
  { name: 'Remo con barra', sets: '3 × 10 reps', badge: 'Espalda' },
  { name: 'Curl de bíceps', sets: '3 × 12 reps', badge: 'Bíceps' },
]

const feedItems = [
  { initials: 'JR', name: 'Juan Rodriguez', action: 'Completó rutina de piernas', time: 'hace 20 min' },
  { initials: 'LP', name: 'Laura Perez', action: 'Nueva racha de 7 días', time: 'hace 1 hora' },
]

const objectives = [
  { name: 'Entrenamientos semanales', current: 3, goal: 5, unit: '', display: '3/5', pct: 60, color: '#22c55e', sub: 'Te faltan 2 para completar la semana' },
  { name: 'Calorías quemadas', current: 1240, goal: 2000, unit: ' kcal', display: '1.240/2.000 kcal', pct: 62, color: '#22c55e', sub: '760 kcal restantes para hoy' },
  { name: 'Peso objetivo', current: 78, goal: 75, unit: ' kg', display: '78/75 kg', pct: 80, color: '#f59e0b', sub: 'Te faltan 3 kg para tu meta' },
  { name: 'Racha de días', current: 5, goal: 7, unit: ' días', display: '5/7 días', pct: 71, color: '#22c55e', sub: '2 días más para completar la semana' },
]

const cardStyle = {
  border: '1px solid #111',
  borderRadius: '8px',
  backgroundColor: '#000',
  padding: '16px',
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <AppLayout>
      <WelcomePopup userName={user?.name} userId={user?.id} />
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>

        {/* Saludo */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>
            Bienvenido, {user?.name}
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: '#666' }}>
            {dateLabel} · <span style={{ color: '#22c55e' }}>{muscleGroup}</span>
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 mb-6" style={{ border: '1px solid #111', borderRadius: '8px', overflow: 'hidden', maxWidth: '960px' }}>
          {[
            { value: '14', label: 'Entrenos', sub: 'este mes' },
            { value: '5', label: 'Racha', sub: 'días' },
            { value: '24', label: 'Seguidores', sub: 'siguiendo 18' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center py-4"
              style={{
                borderRight: i < 2 ? '1px solid #111' : 'none',
                backgroundColor: '#000',
              }}
            >
              <span className="text-2xl font-bold" style={{ color: '#fff' }}>{stat.value}</span>
              <span className="text-xs mt-0.5" style={{ color: '#aaa' }}>{stat.label}</span>
              <span className="text-xs" style={{ color: '#22c55e' }}>{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-4" style={{ maxWidth: '960px' }}>

          {/* Left column */}
          <div className="flex flex-col gap-4 flex-1" style={{ minWidth: 0 }}>

            {/* Rutina de hoy */}
            <div style={cardStyle}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#fff' }}>Rutina de hoy</h2>
              <div className="flex flex-col gap-2 mb-4">
                {exercises.map((ex) => (
                  <div key={ex.name} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium" style={{ color: '#fff' }}>{ex.name}</span>
                      <span className="text-xs ml-2" style={{ color: '#666' }}>{ex.sets}</span>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}
                    >
                      {ex.badge}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="w-full py-2 text-sm font-semibold rounded-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#22c55e', color: '#000' }}
              >
                Iniciar entrenamiento
              </button>
            </div>

            {/* Semana actual */}
            <div style={cardStyle}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#fff' }}>Semana actual</h2>
              <div className="flex gap-2 mb-3">
                {weekDays.map((day, i) => {
                  const isCompleted = completedDays.includes(i)
                  const isToday = i === todayIndex
                  return (
                    <div
                      key={day}
                      className="flex-1 flex items-center justify-center py-2 rounded text-xs font-medium"
                      style={{
                        backgroundColor: isCompleted ? '#0a1a0a' : '#0d0d0d',
                        color: isCompleted ? '#22c55e' : '#444',
                        border: isToday ? '1px solid #fff' : isCompleted ? '1px solid #22c55e44' : '1px solid #111',
                      }}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs mb-2" style={{ color: '#666' }}>3 de 5 entrenamientos</p>
              <div className="w-full rounded-full" style={{ height: '4px', backgroundColor: '#111' }}>
                <div className="rounded-full" style={{ width: '60%', height: '4px', backgroundColor: '#22c55e' }} />
              </div>
            </div>

            {/* Feed */}
            <div style={cardStyle}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#fff' }}>Feed</h2>
              <div className="flex flex-col gap-3">
                {feedItems.map((item) => (
                  <div key={item.initials} className="flex items-center gap-3">
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

          </div>

          {/* Right column — Objetivos */}
          <div
            className="flex flex-col gap-4 lg:w-72 shrink-0"
            style={{ border: '1px solid #111', borderRadius: '8px', padding: '20px', backgroundColor: '#000', alignSelf: 'flex-start' }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: '#333' }}
            >
              Objetivos de la semana
            </p>

            <div className="flex flex-col gap-5">
              {objectives.map((obj) => (
                <div key={obj.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: '#ccc' }}>{obj.name}</span>
                    <span className="text-sm font-medium" style={{ color: '#22c55e' }}>{obj.display}</span>
                  </div>
                  <div className="w-full rounded-full mb-1" style={{ height: '4px', backgroundColor: '#111' }}>
                    <div
                      className="rounded-full"
                      style={{ width: `${obj.pct}%`, height: '4px', backgroundColor: obj.color }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: '#333' }}>{obj.sub}</p>
                </div>
              ))}
            </div>

            {/* Resumen general */}
            <div
              className="rounded-lg p-4 mt-2"
              style={{ backgroundColor: '#0a0a0a', border: '1px solid #111' }}
            >
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#444' }}>Progreso general</p>
              <p className="text-3xl font-bold" style={{ color: '#22c55e' }}>68%</p>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
