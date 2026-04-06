import AppLayout from '../components/AppLayout'
import { List, Sparkles, User } from 'lucide-react'

const weekSchedule = [
  { day: 'Lun', muscles: ['Pecho', 'Tríceps'] },
  { day: 'Mar', muscles: ['Espalda', 'Bíceps'] },
  { day: 'Mié', muscles: [] },
  { day: 'Jue', muscles: ['Hombros', 'Tríceps'] },
  { day: 'Vie', muscles: ['Piernas', 'Glúteos'] },
  { day: 'Sáb', muscles: [] },
  { day: 'Dom', muscles: [] },
]

const cardBase = {
  border: '1px solid #111',
  borderRadius: '8px',
  backgroundColor: '#000',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

export default function Rutinas() {
  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '960px' }}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Rutinas</h1>
          <p className="text-sm mt-1" style={{ color: '#333' }}>
            Elegí cómo querés organizar tu entrenamiento
          </p>
        </div>

        {/* Opciones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">

          {/* Armá tu rutina */}
          <div style={cardBase}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#0a1a0a' }}
            >
              <List size={20} color="#22c55e" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-base font-semibold mb-1" style={{ color: '#fff' }}>Armá tu rutina</p>
              <p className="text-sm" style={{ color: '#555', lineHeight: '1.5' }}>
                Elegí los ejercicios de cada día y organizá tu semana a tu manera.
              </p>
            </div>
            <button
              className="mt-auto w-full py-2 text-sm font-semibold rounded-md transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'transparent', border: '1px solid #22c55e', color: '#22c55e' }}
            >
              Crear rutina
            </button>
          </div>

          {/* Generá con IA */}
          <div style={cardBase}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#0a1a0a' }}
            >
              <Sparkles size={20} color="#22c55e" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-base font-semibold mb-1" style={{ color: '#fff' }}>Generá con IA</p>
              <p className="text-sm" style={{ color: '#555', lineHeight: '1.5' }}>
                Contanos tus objetivos y te armamos una rutina personalizada con inteligencia artificial.
              </p>
            </div>
            <button
              className="mt-auto w-full py-2 text-sm font-semibold rounded-md transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'transparent', border: '1px solid #22c55e', color: '#22c55e' }}
            >
              Generar rutina
            </button>
          </div>

          {/* Contactar entrenador */}
          <div style={cardBase}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#0a1a0a' }}
            >
              <User size={20} color="#22c55e" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-base font-semibold mb-1" style={{ color: '#fff' }}>Contactar entrenador</p>
              <p className="text-sm" style={{ color: '#555', lineHeight: '1.5' }}>
                Pedile a un profesional que te diseñe una rutina a medida según tus objetivos.
              </p>
            </div>
            <button
              className="mt-auto w-full py-2 text-sm font-semibold rounded-md transition-opacity hover:opacity-70"
              style={{ backgroundColor: 'transparent', border: '1px solid #22c55e', color: '#22c55e' }}
            >
              Buscar entrenador
            </button>
          </div>

        </div>

        {/* Mi rutina actual */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#333' }}
          >
            Mi rutina actual
          </p>

          <div style={{ border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000' }}>
            {/* Card header */}
            <div
              className="flex items-start justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #111' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: '#fff' }}>Rutina Fuerza — Semana 1</p>
                <p className="text-xs mt-0.5" style={{ color: '#555' }}>5 días · 4 ejercicios por día</p>
              </div>
              <button
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: '#22c55e' }}
              >
                Editar
              </button>
            </div>

            {/* Vista semanal */}
            <div className="grid grid-cols-7 gap-px p-4" style={{ gap: '8px' }}>
              {weekSchedule.map(({ day, muscles }) => (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-medium" style={{ color: '#444' }}>{day}</span>
                  {muscles.length > 0 ? (
                    <div className="flex flex-col gap-1 w-full">
                      {muscles.map((m) => (
                        <span
                          key={m}
                          className="text-center text-xs rounded px-1 py-0.5"
                          style={{
                            backgroundColor: '#0a1a0a',
                            color: '#22c55e',
                            border: '1px solid #1a3a1a',
                            fontSize: '10px',
                            lineHeight: '1.4',
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-center" style={{ color: '#333', fontSize: '10px' }}>Descanso</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
