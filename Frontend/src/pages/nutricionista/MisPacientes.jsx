import { useState } from 'react'
import AppLayout from '../../components/AppLayout'

const initialPacientes = [
  { id: 1, initials: 'MR', name: 'María Rodriguez', goal: 'Bajar de peso', age: 29, weight: '68 kg', target: '62 kg', adherencia: 85, active: true },
  { id: 2, initials: 'LP', name: 'Lucas Perez', goal: 'Ganar masa muscular', age: 23, weight: '72 kg', target: '78 kg', adherencia: 70, active: true },
  { id: 3, initials: 'AG', name: 'Ana González', goal: 'Alimentación saludable', age: 35, weight: '60 kg', target: '58 kg', adherencia: 90, active: true },
  { id: 4, initials: 'TC', name: 'Tomás Castro', goal: 'Control de glucemia', age: 42, weight: '85 kg', target: '80 kg', adherencia: 60, active: true },
  { id: 5, initials: 'PV', name: 'Paula Vega', goal: 'Rendimiento deportivo', age: 26, weight: '55 kg', target: '57 kg', adherencia: 40, active: false },
  { id: 6, initials: 'NB', name: 'Nicolás Bravo', goal: 'Bajar de peso', age: 38, weight: '92 kg', target: '82 kg', adherencia: 30, active: false },
]

export default function MisPacientes() {
  const [search, setSearch] = useState('')

  const filtered = initialPacientes.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6 flex items-center justify-between" style={{ maxWidth: '960px' }}>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Mis pacientes</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>{initialPacientes.length} pacientes en total</p>
          </div>
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm rounded-md outline-none"
            style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', color: '#fff', width: '200px' }}
          />
        </div>

        <div className="flex flex-col gap-3" style={{ maxWidth: '960px' }}>
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4"
              style={{ border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: '#fff' }}>{p.name}</span>
                  <span className="text-xs" style={{ color: '#444' }}>{p.age} años</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={p.active
                      ? { backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }
                      : { backgroundColor: '#1a0a0a', color: '#ef4444', border: '1px solid #ef444444' }}
                  >
                    {p.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs mb-2" style={{ color: '#666' }}>{p.goal} · {p.weight} → {p.target}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full" style={{ height: '4px', backgroundColor: '#111', maxWidth: '160px' }}>
                    <div className="rounded-full" style={{ width: `${p.adherencia}%`, height: '4px', backgroundColor: p.adherencia >= 70 ? '#22c55e' : '#f59e0b' }} />
                  </div>
                  <span className="text-xs" style={{ color: p.adherencia >= 70 ? '#22c55e' : '#f59e0b' }}>{p.adherencia}% adherencia</span>
                </div>
              </div>
              <button
                className="px-4 py-1.5 text-xs font-semibold rounded-md shrink-0"
                style={{ border: '1px solid #22c55e44', color: '#22c55e', backgroundColor: '#0a1a0a' }}
              >
                Ver perfil
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: '#444' }}>No se encontraron pacientes</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
