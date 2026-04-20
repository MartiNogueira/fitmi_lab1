import { useState } from 'react'
import AppLayout from '../../components/AppLayout'

const alumnos = [
  { initials: 'JR', name: 'Juan Rodriguez', goal: 'Ganar masa muscular', rutina: 'Fuerza 4 días', streak: 7, progress: 80, lastActive: 'Hoy' },
  { initials: 'LP', name: 'Laura Perez', goal: 'Perder peso', rutina: 'Cardio + Fuerza', streak: 12, progress: 65, lastActive: 'Hoy' },
  { initials: 'CM', name: 'Carlos Méndez', goal: 'Mantenimiento', rutina: 'Full body 3 días', streak: 3, progress: 50, lastActive: 'Ayer' },
  { initials: 'AG', name: 'Ana González', goal: 'Ganar masa muscular', rutina: 'Hipertrofia 5 días', streak: 5, progress: 72, lastActive: 'Ayer' },
  { initials: 'MF', name: 'Marcos Fernández', goal: 'Perder peso', rutina: 'Cardio 4 días', streak: 0, progress: 30, lastActive: 'hace 5 días' },
  { initials: 'SR', name: 'Sofía Ramírez', goal: 'Tonificar', rutina: 'Funcional 3 días', streak: 0, progress: 45, lastActive: 'hace 4 días' },
]

export default function MisAlumnos() {
  const [search, setSearch] = useState('')
  const filtered = alumnos.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6 flex items-center justify-between" style={{ maxWidth: '960px' }}>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Mis alumnos</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>{alumnos.length} alumnos asignados</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold rounded-md" style={{ backgroundColor: '#22c55e', color: '#000' }}>
            + Agregar alumno
          </button>
        </div>

        <div className="mb-4" style={{ maxWidth: '960px' }}>
          <input
            type="text" placeholder="Buscar alumno..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-md outline-none"
            style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', color: '#fff' }}
          />
        </div>

        <div className="flex flex-col gap-3" style={{ maxWidth: '960px' }}>
          {filtered.map((alumno) => {
            const isInactive = alumno.streak === 0
            return (
              <div key={alumno.name} className="flex items-center gap-4 p-4 rounded-lg"
                style={{ border: '1px solid #111', backgroundColor: '#000' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: isInactive ? '#1a0a0a' : '#0a1a0a',
                    color: isInactive ? '#ef4444' : '#22c55e',
                    border: `1px solid ${isInactive ? '#ef444444' : '#22c55e44'}`,
                  }}>
                  {alumno.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={{ color: '#fff' }}>{alumno.name}</span>
                    {isInactive && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1a0a0a', color: '#ef4444', border: '1px solid #ef444444' }}>
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: '#666' }}>{alumno.goal} · {alumno.rutina}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 w-32">
                  <div className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: '#444' }}>Progreso</span>
                    <span className="text-xs font-medium" style={{ color: '#22c55e' }}>{alumno.progress}%</span>
                  </div>
                  <div className="w-full rounded-full" style={{ height: '3px', backgroundColor: '#111' }}>
                    <div className="rounded-full" style={{ width: `${alumno.progress}%`, height: '3px', backgroundColor: isInactive ? '#ef4444' : '#22c55e' }} />
                  </div>
                  <span className="text-xs" style={{ color: '#444' }}>{alumno.lastActive}</span>
                </div>
                <div className="flex flex-col items-center shrink-0 w-16">
                  <span className="text-lg font-bold" style={{ color: isInactive ? '#ef4444' : '#22c55e' }}>{alumno.streak}</span>
                  <span className="text-xs" style={{ color: '#444' }}>racha</span>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium rounded-md shrink-0"
                  style={{ border: '1px solid #222', color: '#aaa', backgroundColor: '#0d0d0d' }}>
                  Ver perfil
                </button>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-center py-12" style={{ color: '#444' }}>No se encontraron alumnos</p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
