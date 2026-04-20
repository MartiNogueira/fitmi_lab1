import { useState } from 'react'
import AppLayout from '../../components/AppLayout'

const initialSolicitudes = [
  { id: 1, initials: 'CM', name: 'Camila Morales', goal: 'Bajar de peso', age: 28, message: 'Hola, quiero empezar a comer mejor. Tengo hipotiroidismo y me cuesta mucho bajar de peso, busco un plan personalizado.', date: 'hace 1 hora' },
  { id: 2, initials: 'FR', name: 'Felipe Ríos', goal: 'Rendimiento deportivo', age: 22, message: 'Soy nadador amateur y quiero optimizar mi alimentación para mejorar mis tiempos. Entreno 5 veces por semana.', date: 'hace 3 horas' },
]

export default function SolicitudesNutricionista() {
  const [solicitudes, setSolicitudes] = useState(initialSolicitudes)
  const [expanded, setExpanded] = useState(null)

  const handle = (id) => { setSolicitudes((prev) => prev.filter((s) => s.id !== id)); setExpanded(null) }

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6" style={{ maxWidth: '720px' }}>
          <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Solicitudes</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            {solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} pendiente{solicitudes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col gap-3" style={{ maxWidth: '720px' }}>
          {solicitudes.map((s) => (
            <div key={s.id} style={{ border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000', overflow: 'hidden' }}>
              <div className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                  {s.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#fff' }}>{s.name}</span>
                    <span className="text-xs" style={{ color: '#444' }}>{s.age} años</span>
                  </div>
                  <p className="text-xs" style={{ color: '#666' }}>{s.goal}</p>
                </div>
                <span className="text-xs shrink-0" style={{ color: '#444' }}>{s.date}</span>
              </div>
              {expanded === s.id && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid #111' }}>
                  <p className="text-sm mt-3 mb-4 leading-relaxed" style={{ color: '#aaa' }}>"{s.message}"</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 text-sm font-semibold rounded-md"
                      style={{ backgroundColor: '#22c55e', color: '#000' }} onClick={() => handle(s.id)}>
                      Aceptar
                    </button>
                    <button className="flex-1 py-2 text-sm font-semibold rounded-md"
                      style={{ border: '1px solid #ef444444', color: '#ef4444', backgroundColor: '#1a0a0a' }} onClick={() => handle(s.id)}>
                      Rechazar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {solicitudes.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: '#444' }}>No hay solicitudes pendientes</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
