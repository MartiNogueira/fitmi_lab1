import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../context/AuthContext'
import { getMiPlan, getCompletadasPlan, toggleComida, generarPlanIA, guardarPlanIA } from '../api/auth'

const MOMENTO_ORDER = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack']

const TIPOS_DIETA = ['Equilibrada', 'Vegetariana', 'Alta en proteínas', 'Keto']
const OBJETIVOS_PLAN = ['Bajar de peso', 'Ganar músculo', 'Mantenimiento', 'Mejorar energía']
const DIAS_OPTIONS = [5, 6, 7]

export default function Alimentacion() {
  const { user } = useAuth()
  const [plan, setPlan] = useState(null)
  const [completadas, setCompletadas] = useState([])
  const [diaActivo, setDiaActivo] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  // Estados del modal IA
  const [showIA, setShowIA] = useState(false)
  const [iaStep, setIaStep] = useState('form') // 'form' | 'loading' | 'preview'
  const [iaDesc, setIaDesc] = useState('')
  const [iaTipo, setIaTipo] = useState('Equilibrada')
  const [iaObjetivo, setIaObjetivo] = useState('Mantenimiento')
  const [iaDias, setIaDias] = useState(7)
  const [iaRestricciones, setIaRestricciones] = useState('')
  const [iaError, setIaError] = useState('')
  const [iaGenerado, setIaGenerado] = useState(null)
  const [iaSaving, setIaSaving] = useState(false)

  const abrirIA = () => {
    setIaStep('form'); setIaDesc(''); setIaTipo('Equilibrada')
    setIaObjetivo('Mantenimiento'); setIaDias(7); setIaRestricciones('')
    setIaError(''); setIaGenerado(null); setShowIA(true)
  }

  const handleGenerarIA = async () => {
    if (!iaDesc.trim()) { setIaError('Describí qué tipo de plan querés'); return }
    setIaError(''); setIaStep('loading')
    try {
      const { data } = await generarPlanIA({ descripcion: iaDesc, tipo: iaTipo, objetivo: iaObjetivo, dias: iaDias, restricciones: iaRestricciones })
      setIaGenerado(data); setIaStep('preview')
    } catch {
      setIaError('No se pudo generar el plan. Intentá de nuevo.'); setIaStep('form')
    }
  }

  const handleGuardarIA = async () => {
    if (!iaGenerado) return
    setIaSaving(true)
    try {
      const { data } = await guardarPlanIA({ nombre: iaGenerado.nombre, objetivo: iaGenerado.objetivo, dias: iaGenerado.dias })
      setPlan(data); setShowIA(false)
    } catch {
      setIaError('No se pudo guardar el plan.')
    }
    setIaSaving(false)
  }

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
              {user?.rol === 'cliente' ? (
                <>
                  <p className="text-xs mt-2 mb-5" style={{ color: '#333' }}>Podés generar uno con IA o esperar que tu nutricionista te asigne uno.</p>
                  <button onClick={abrirIA}
                    className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ backgroundColor: '#0a1a0a', border: '1px solid #22c55e', color: '#22c55e' }}>
                    ✨ Generar plan con IA
                  </button>
                </>
              ) : (
                <p className="text-xs mt-2" style={{ color: '#333' }}>Tu nutricionista te asignará uno cuando esté listo.</p>
              )}
            </div>
          </div>
          {showIA && renderModalIA()}
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

  function renderModalIA() {
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #111' }}>
          <span className="text-sm font-semibold" style={{ color: '#fff' }}>
            {iaStep === 'preview' ? 'Plan generado' : 'Generar plan con IA'}
          </span>
          <button onClick={() => setShowIA(false)} style={{ color: '#555', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        {iaStep === 'form' && (
          <div className="px-6 py-5 flex flex-col gap-5">
            <div>
              <label className="block text-xs mb-2 uppercase tracking-widest" style={{ color: '#555' }}>¿Qué tipo de plan querés?</label>
              <textarea
                value={iaDesc}
                onChange={e => setIaDesc(e.target.value)}
                placeholder="Ej: Quiero un plan saludable para la semana, sin gluten, con comidas rápidas de preparar..."
                rows={3}
                className="w-full text-sm resize-none outline-none"
                style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '12px', color: '#fff' }}
              />
            </div>

            <div>
              <label className="block text-xs mb-2 uppercase tracking-widest" style={{ color: '#555' }}>Tipo de dieta</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_DIETA.map(t => (
                  <button key={t} onClick={() => setIaTipo(t)}
                    className="text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: iaTipo === t ? '#0a1a0a' : '#0d0d0d', border: iaTipo === t ? '1px solid #22c55e' : '1px solid #1a1a1a', color: iaTipo === t ? '#22c55e' : '#555' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs mb-2 uppercase tracking-widest" style={{ color: '#555' }}>Objetivo</label>
              <div className="flex flex-wrap gap-2">
                {OBJETIVOS_PLAN.map(o => (
                  <button key={o} onClick={() => setIaObjetivo(o)}
                    className="text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: iaObjetivo === o ? '#0a1a0a' : '#0d0d0d', border: iaObjetivo === o ? '1px solid #22c55e' : '1px solid #1a1a1a', color: iaObjetivo === o ? '#22c55e' : '#555' }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs mb-2 uppercase tracking-widest" style={{ color: '#555' }}>Días del plan</label>
              <div className="flex gap-2">
                {DIAS_OPTIONS.map(d => (
                  <button key={d} onClick={() => setIaDias(d)}
                    className="text-xs px-4 py-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: iaDias === d ? '#0a1a0a' : '#0d0d0d', border: iaDias === d ? '1px solid #22c55e' : '1px solid #1a1a1a', color: iaDias === d ? '#22c55e' : '#555' }}>
                    {d} días
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs mb-2 uppercase tracking-widest" style={{ color: '#555' }}>Restricciones o preferencias (opcional)</label>
              <input
                value={iaRestricciones}
                onChange={e => setIaRestricciones(e.target.value)}
                placeholder="Ej: sin lactosa, sin mariscos, vegetales de temporada..."
                className="w-full text-sm outline-none"
                style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '10px 14px', color: '#fff' }}
              />
            </div>

            {iaError && <p className="text-xs" style={{ color: '#ef4444' }}>{iaError}</p>}

            <button onClick={handleGenerarIA}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#22c55e', color: '#000' }}>
              Generar con IA ✨
            </button>
          </div>
        )}

        {iaStep === 'loading' && (
          <div className="px-6 py-16 flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#22c55e', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#555' }}>Generando tu plan alimenticio...</p>
          </div>
        )}

        {iaStep === 'preview' && iaGenerado && (
          <div className="px-6 py-5 flex flex-col gap-4">
            <div>
              <p className="text-base font-bold" style={{ color: '#fff' }}>{iaGenerado.nombre}</p>
              <p className="text-xs mt-0.5" style={{ color: '#555' }}>{iaGenerado.objetivo}</p>
            </div>
            {iaGenerado.dias?.map(dia => (
              <div key={dia.dia}>
                <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#22c55e' }}>{dia.nombre}</p>
                <div className="flex flex-col gap-1.5">
                  {dia.comidas?.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: '#0d0d0d', border: '1px solid #111' }}>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 capitalize mt-0.5" style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e33' }}>{c.momento}</span>
                      <div>
                        <p className="text-sm" style={{ color: '#fff' }}>{c.nombre}</p>
                        {c.descripcion && <p className="text-xs mt-0.5" style={{ color: '#555' }}>{c.descripcion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {iaError && <p className="text-xs" style={{ color: '#ef4444' }}>{iaError}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setIaStep('form'); setIaError('') }}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', color: '#555' }}>
                Generar otro
              </button>
              <button onClick={handleGuardarIA} disabled={iaSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#22c55e', color: '#000', opacity: iaSaving ? 0.7 : 1 }}>
                {iaSaving ? 'Guardando...' : 'Guardar plan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '720px' }}>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Alimentación</h1>
            <p className="text-sm mt-1" style={{ color: '#555' }}>{plan.nombre} · {plan.objetivo}</p>
          </div>
          {user?.rol === 'cliente' && (
            <button onClick={abrirIA}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0"
              style={{ backgroundColor: '#0a1a0a', border: '1px solid #22c55e44', color: '#22c55e' }}>
              ✨ Nuevo plan IA
            </button>
          )}
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
      {showIA && renderModalIA()}
    </AppLayout>
  )
}
