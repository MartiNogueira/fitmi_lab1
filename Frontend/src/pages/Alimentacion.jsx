import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../components/AppLayout'
import { getMiPlan, getCompletadasPlan, toggleComida } from '../api/auth'

const MOMENTO_ORDER = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack']

export default function Alimentacion() {
  const [plan, setPlan] = useState(null)
  const [completadas, setCompletadas] = useState([])
  const [diaActivo, setDiaActivo] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  const cargarCompletadas = useCallback(async (plan_id) => {
    const { data } = await getCompletadasPlan(plan_id)
    setCompletadas(data)
  }, [])

  useEffect(() => {
    getMiPlan()
      .then(({ data }) => {
        setPlan(data)
        if (data) cargarCompletadas(data.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cargarCompletadas])

  const isCompletada = (dia_numero, comida_nombre) =>
    completadas.some(c => c.dia_numero === dia_numero && c.comida_nombre === comida_nombre)

  const handleToggle = async (dia_numero, comida_nombre) => {
    const key = `${dia_numero}-${comida_nombre}`
    setToggling(key)
    try {
      const { data } = await toggleComida({ plan_id: plan.id, dia_numero, comida_nombre })
      if (data.completado) {
        setCompletadas(prev => [...prev, { dia_numero, comida_nombre }])
      } else {
        setCompletadas(prev => prev.filter(c => !(c.dia_numero === dia_numero && c.comida_nombre === comida_nombre)))
      }
    } catch {}
    setToggling(null)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000' }}>
          <p className="text-sm" style={{ color: '#444' }}>Cargando...</p>
        </div>
      </AppLayout>
    )
  }

  if (!plan) {
    return (
      <AppLayout>
        <div className="min-h-screen px-6 pt-16 pb-8 flex flex-col" style={{ backgroundColor: '#000' }}>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#fff' }}>Alimentación</h1>
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <p className="text-sm" style={{ color: '#444' }}>No tenés un plan alimenticio asignado todavía.</p>
              <p className="text-xs mt-2" style={{ color: '#333' }}>Tu nutricionista te asignará uno cuando esté listo.</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const dia = plan.dias[diaActivo]
  const comidasOrdenadas = [...dia.comidas].sort(
    (a, b) => MOMENTO_ORDER.indexOf(a.momento) - MOMENTO_ORDER.indexOf(b.momento)
  )
  const completadasHoy = dia.comidas.filter(c => isCompletada(dia.dia, c.nombre)).length
  const totalHoy = dia.comidas.length

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '720px' }}>

        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Alimentación</h1>
          <p className="text-sm mt-1" style={{ color: '#555' }}>{plan.nombre} · {plan.objetivo}</p>
        </div>

        {/* Selector de días */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {plan.dias.map((d, i) => {
            const comp = d.comidas.filter(c => isCompletada(d.dia, c.nombre)).length
            const isActive = i === diaActivo
            return (
              <button key={d.dia} onClick={() => setDiaActivo(i)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: isActive ? '#0a1a0a' : '#0d0d0d',
                  border: isActive ? '1px solid #22c55e' : '1px solid #111',
                  color: isActive ? '#22c55e' : '#555',
                }}>
                {d.nombre}
                {comp > 0 && <span className="ml-1.5" style={{ color: '#22c55e' }}>·{comp}/{d.comidas.length}</span>}
              </button>
            )
          })}
        </div>

        {/* Progreso del día */}
        <div className="mb-4" style={{ border: '1px solid #111', borderRadius: '8px', padding: '16px', backgroundColor: '#000' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest" style={{ color: '#333' }}>Progreso de hoy</span>
            <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>{completadasHoy}/{totalHoy}</span>
          </div>
          <div className="w-full rounded-full" style={{ height: '4px', backgroundColor: '#111' }}>
            <div className="rounded-full transition-all" style={{
              width: totalHoy ? `${(completadasHoy / totalHoy) * 100}%` : '0%',
              height: '4px',
              backgroundColor: '#22c55e',
            }} />
          </div>
        </div>

        {/* Lista de comidas */}
        <div className="flex flex-col gap-2">
          {comidasOrdenadas.length === 0 ? (
            <p className="text-sm" style={{ color: '#444' }}>No hay comidas para este día.</p>
          ) : (
            comidasOrdenadas.map((comida) => {
              const done = isCompletada(dia.dia, comida.nombre)
              const key = `${dia.dia}-${comida.nombre}`
              const isToggling = toggling === key
              return (
                <button
                  key={key}
                  onClick={() => handleToggle(dia.dia, comida.nombre)}
                  disabled={isToggling}
                  className="flex items-center gap-4 text-left transition-all"
                  style={{
                    border: done ? '1px solid #22c55e44' : '1px solid #111',
                    borderRadius: '8px',
                    backgroundColor: done ? '#0a1a0a' : '#000',
                    padding: '14px 16px',
                    opacity: isToggling ? 0.6 : 1,
                  }}
                >
                  {/* Checkbox visual */}
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    border: done ? '2px solid #22c55e' : '2px solid #333',
                    backgroundColor: done ? '#22c55e' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done && <span style={{ color: '#000', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: done ? '#22c55e' : '#fff', textDecoration: done ? 'line-through' : 'none' }}>
                      {comida.nombre}
                    </p>
                    {comida.descripcion && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#555' }}>{comida.descripcion}</p>
                    )}
                  </div>

                  <span className="text-xs capitalize shrink-0 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#0d0d0d', color: '#555', border: '1px solid #1a1a1a' }}>
                    {comida.momento}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </AppLayout>
  )
}
