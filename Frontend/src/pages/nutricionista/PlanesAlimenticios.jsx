import { useState } from 'react'
import AppLayout from '../../components/AppLayout'

const initialPlanes = [
  {
    id: 1, name: 'Plan déficit calórico', calories: '1800 kcal/día', goal: 'Pérdida de peso',
    pacientes: ['María Rodriguez', 'Nicolás Bravo'],
    meals: ['Desayuno: Avena con frutas (350 kcal)', 'Almuerzo: Pollo con ensalada (500 kcal)', 'Merienda: Yogur proteico (200 kcal)', 'Cena: Pescado con vegetales (450 kcal)'],
  },
  {
    id: 2, name: 'Plan volumen limpio', calories: '3200 kcal/día', goal: 'Ganancia muscular',
    pacientes: ['Lucas Perez'],
    meals: ['Desayuno: Huevos + tostadas + jugo (600 kcal)', 'Media mañana: Batido proteico (400 kcal)', 'Almuerzo: Arroz + carne + legumbres (900 kcal)', 'Merienda: Frutos secos + banana (350 kcal)', 'Cena: Pasta + pollo (750 kcal)'],
  },
  {
    id: 3, name: 'Plan equilibrado', calories: '2000 kcal/día', goal: 'Salud general',
    pacientes: ['Ana González', 'Paula Vega'],
    meals: ['Desayuno: Fruta + infusión (200 kcal)', 'Almuerzo: Proteína + vegetales + carbohidrato (600 kcal)', 'Merienda: Fruta seca (200 kcal)', 'Cena: Sopa + proteína magra (500 kcal)'],
  },
  {
    id: 4, name: 'Plan bajo índice glucémico', calories: '1900 kcal/día', goal: 'Control glucémico',
    pacientes: ['Tomás Castro'],
    meals: ['Desayuno: Huevos revueltos + vegetales (300 kcal)', 'Media mañana: Nueces (150 kcal)', 'Almuerzo: Legumbres + ensalada (550 kcal)', 'Merienda: Queso + fruta (200 kcal)', 'Cena: Pollo + brócoli (450 kcal)'],
  },
]

export default function PlanesAlimenticios() {
  const [expanded, setExpanded] = useState(null)

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6" style={{ maxWidth: '720px' }}>
          <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Planes alimenticios</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>{initialPlanes.length} planes activos</p>
        </div>

        <div className="flex flex-col gap-3" style={{ maxWidth: '720px' }}>
          {initialPlanes.map((plan) => (
            <div key={plan.id} style={{ border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000', overflow: 'hidden' }}>
              <div className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: '#fff' }}>{plan.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                      {plan.goal}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#666' }}>{plan.calories} · {plan.pacientes.length} paciente{plan.pacientes.length !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-xs shrink-0" style={{ color: '#444' }}>{expanded === plan.id ? '▲' : '▼'}</span>
              </div>

              {expanded === plan.id && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid #111' }}>
                  <p className="text-xs font-semibold mt-3 mb-2 uppercase tracking-widest" style={{ color: '#444' }}>Comidas del día</p>
                  <div className="flex flex-col gap-1 mb-4">
                    {plan.meals.map((meal, i) => (
                      <p key={i} className="text-sm" style={{ color: '#aaa' }}>· {meal}</p>
                    ))}
                  </div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#444' }}>Asignado a</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {plan.pacientes.map((p) => (
                      <span key={p} className="text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 text-sm font-semibold rounded-md"
                      style={{ border: '1px solid #22c55e44', color: '#22c55e', backgroundColor: '#0a1a0a' }}>
                      Editar
                    </button>
                    <button className="flex-1 py-2 text-sm font-semibold rounded-md"
                      style={{ backgroundColor: '#22c55e', color: '#000' }}>
                      Asignar paciente
                    </button>
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
