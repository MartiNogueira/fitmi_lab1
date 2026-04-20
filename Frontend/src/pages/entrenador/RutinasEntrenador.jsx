import { useState } from 'react'
import AppLayout from '../../components/AppLayout'

const rutinas = [
  { id: 1, name: 'Fuerza 4 días', goal: 'Hipertrofia', days: 4, exercises: 18, assignedTo: ['Juan Rodriguez', 'Ana González'] },
  { id: 2, name: 'Cardio + Fuerza', goal: 'Pérdida de peso', days: 5, exercises: 14, assignedTo: ['Laura Perez'] },
  { id: 3, name: 'Full body 3 días', goal: 'Mantenimiento', days: 3, exercises: 12, assignedTo: ['Carlos Méndez'] },
  { id: 4, name: 'Funcional 3 días', goal: 'Tonificación', days: 3, exercises: 10, assignedTo: ['Sofía Ramírez'] },
]

const cardStyle = { border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000', padding: '16px' }

export default function RutinasEntrenador() {
  const [selected, setSelected] = useState(null)

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6 flex items-center justify-between" style={{ maxWidth: '960px' }}>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Rutinas</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>{rutinas.length} rutinas creadas</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold rounded-md" style={{ backgroundColor: '#22c55e', color: '#000' }}>
            + Nueva rutina
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3" style={{ maxWidth: '960px' }}>
          {rutinas.map((rutina) => (
            <div key={rutina.id}
              style={{ ...cardStyle, border: selected === rutina.id ? '1px solid #22c55e44' : '1px solid #111', cursor: 'pointer' }}
              onClick={() => setSelected(selected === rutina.id ? null : rutina.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium" style={{ color: '#fff' }}>{rutina.name}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: '#666' }}>{rutina.goal}</span>
                    <span className="text-xs" style={{ color: '#444' }}>·</span>
                    <span className="text-xs" style={{ color: '#666' }}>{rutina.days} días/semana</span>
                    <span className="text-xs" style={{ color: '#444' }}>·</span>
                    <span className="text-xs" style={{ color: '#666' }}>{rutina.exercises} ejercicios</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {rutina.assignedTo.slice(0, 3).map((name) => (
                      <div key={name} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }} title={name}>
                        {name.split(' ').map((n) => n[0]).join('')}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md"
                      style={{ border: '1px solid #222', color: '#aaa', backgroundColor: '#0d0d0d' }}
                      onClick={(e) => e.stopPropagation()}>
                      Editar
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md"
                      style={{ border: '1px solid #22c55e44', color: '#22c55e', backgroundColor: '#0a1a0a' }}
                      onClick={(e) => e.stopPropagation()}>
                      Asignar
                    </button>
                  </div>
                </div>
              </div>
              {selected === rutina.id && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #111' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#666' }}>Asignada a:</p>
                  <div className="flex flex-wrap gap-2">
                    {rutina.assignedTo.map((name) => (
                      <span key={name} className="text-xs px-3 py-1 rounded-full"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
