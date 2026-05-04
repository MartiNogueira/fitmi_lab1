import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import { getExercises } from '../api/exercisedb'
import { getMiRutina, getCompletadosRutina, toggleEjercicio } from '../api/auth'

const inputStyle = {
  backgroundColor: '#0a0a0a',
  border: '1px solid #111',
  borderRadius: '8px',
  padding: '9px 12px',
  color: '#fff',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
}

const cardStyle = {
  border: '1px solid #111',
  borderRadius: '8px',
  backgroundColor: '#000',
  padding: '20px',
}

const LEVEL_COLOR = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  expert: '#ef4444',
}

const FORCE_LABEL = { push: 'Empuje', pull: 'Jalón', static: 'Estático' }
const MECHANIC_LABEL = { compound: 'Compuesto', isolation: 'Aislamiento' }

// Animated image that alternates between frame 0 and frame 1 to simulate movement
function ExerciseAnimation({ images, name }) {
  const [frame, setFrame] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (images.length < 2) return
    intervalRef.current = setInterval(() => setFrame(f => (f === 0 ? 1 : 0)), 800)
    return () => clearInterval(intervalRef.current)
  }, [images])

  if (!images.length) {
    return (
      <div className="w-full flex items-center justify-center"
        style={{ aspectRatio: '4/3', backgroundColor: '#0d0d0d', borderRadius: '12px' }}>
        <span className="text-xs" style={{ color: '#333' }}>Sin imagen</span>
      </div>
    )
  }

  return (
    <div className="w-full relative overflow-hidden"
      style={{ aspectRatio: '4/3', backgroundColor: '#0d0d0d', borderRadius: '12px' }}>
      {images.slice(0, 2).map((src, i) => (
        <img
          key={i}
          src={src}
          alt={name}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'contain',
            opacity: frame === i ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

const TRANSLATIONS_CACHE_KEY = 'exercise_translations_es_v1'

async function translateOne(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  const json = await res.json()
  return json[0].map(t => t[0]).join('')
}

async function translateInstructions(exerciseId, instructions) {
  if (!instructions.length) return []
  const cache = JSON.parse(localStorage.getItem(TRANSLATIONS_CACHE_KEY) || '{}')
  if (cache[exerciseId]) return cache[exerciseId]

  try {
    const translated = await Promise.all(instructions.map(translateOne))
    cache[exerciseId] = translated
    localStorage.setItem(TRANSLATIONS_CACHE_KEY, JSON.stringify(cache))
    return translated
  } catch {
    return instructions
  }
}

function ExerciseDrawer({ exercise, onClose }) {
  const [instructions, setInstructions] = useState([])
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (!exercise) return
    setInstructions([])
    if (!exercise.instructions.length) return
    setTranslating(true)
    translateInstructions(exercise.id, exercise.instructions)
      .then(setInstructions)
      .finally(() => setTranslating(false))
  }, [exercise])

  if (!exercise) return null

  const levelColor = LEVEL_COLOR[exercise.level] ?? '#555'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: '#000000cc',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #1a1a1a',
          borderRadius: '20px 20px 0 0',
          zIndex: 50,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '0 0 40px 0',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: '#222' }} />
        </div>

        <div className="px-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-3">
            <h2 className="text-lg font-bold capitalize" style={{ color: '#fff', lineHeight: '1.3' }}>
              {exercise.name}
            </h2>
            <button onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#1a1a1a', color: '#666' }}>
              ✕
            </button>
          </div>

          {/* Animation */}
          <div className="mb-5">
            <ExerciseAnimation images={exercise.images} name={exercise.name} />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {exercise.level && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: `${levelColor}15`, color: levelColor, border: `1px solid ${levelColor}44` }}>
                {exercise.level}
              </span>
            )}
            {exercise.equipment && (
              <span className="text-xs px-2.5 py-1 rounded-full capitalize"
                style={{ backgroundColor: '#111', color: '#888', border: '1px solid #1a1a1a' }}>
                {exercise.equipment}
              </span>
            )}
            {exercise.mechanic && (
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#111', color: '#888', border: '1px solid #1a1a1a' }}>
                {MECHANIC_LABEL[exercise.mechanic] ?? exercise.mechanic}
              </span>
            )}
            {exercise.force && (
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#111', color: '#888', border: '1px solid #1a1a1a' }}>
                {FORCE_LABEL[exercise.force] ?? exercise.force}
              </span>
            )}
            {exercise.category && (
              <span className="text-xs px-2.5 py-1 rounded-full capitalize"
                style={{ backgroundColor: '#111', color: '#555', border: '1px solid #1a1a1a' }}>
                {exercise.category}
              </span>
            )}
          </div>

          {/* Muscles */}
          {(exercise.primaryMuscles.length > 0 || exercise.secondaryMuscles.length > 0) && (
            <div className="mb-5 p-4 rounded-xl" style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>
              {exercise.primaryMuscles.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#22c55e' }}>
                    Músculos principales
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.primaryMuscles.map(m => (
                      <span key={m} className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e33' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {exercise.secondaryMuscles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#555' }}>
                    Músculos secundarios
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.secondaryMuscles.map(m => (
                      <span key={m} className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: '#111', color: '#666', border: '1px solid #1a1a1a' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#555' }}>
                Instrucciones
              </p>
              {translating ? (
                <p className="text-sm" style={{ color: '#444' }}>Traduciendo...</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {instructions.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs font-bold shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: '#111', color: '#22c55e', border: '1px solid #1a1a1a', fontSize: '10px' }}>
                        {i + 1}
                      </span>
                      <p className="text-sm" style={{ color: '#aaa', lineHeight: '1.6' }}>{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function TabExplorar() {
  const [exercises, setExercises] = useState([])
  const [bodyParts, setBodyParts] = useState(['Todos'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('Todos')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getExercises()
      .then((data) => {
        setExercises(data)
        const parts = ['Todos', ...new Set(data.map((e) => e.bodyPart))]
        setBodyParts(parts)
      })
      .catch(() => setError('No se pudieron cargar los ejercicios'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      const matchesGroup = activeGroup === 'Todos' || ex.bodyPart === activeGroup
      return matchesSearch && matchesGroup
    })
  }, [exercises, search, activeGroup])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm" style={{ color: '#444' }}>Cargando ejercicios...</p>
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm px-3 py-2 rounded-md"
        style={{ backgroundColor: '#1a0a0a', color: '#f87171', border: '1px solid #3a1010' }}>
        {error}
      </p>
    )
  }

  return (
    <>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar ejercicio..."
        className="w-full mb-5 outline-none text-sm"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = '#22c55e44')}
        onBlur={(e) => (e.target.style.borderColor = '#111')}
      />

      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#333' }}>
          Grupo muscular
        </p>
        <div className="flex flex-wrap gap-2">
          {bodyParts.map((group) => {
            const isActive = activeGroup === group
            return (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className="text-xs px-3 py-1 rounded-full transition-colors capitalize"
                style={{
                  backgroundColor: isActive ? '#0a1a0a' : 'transparent',
                  border: isActive ? '1px solid #1a3a1a' : '1px solid #111',
                  color: isActive ? '#22c55e' : '#555',
                }}
              >
                {group}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-xs mb-4" style={{ color: '#444' }}>
        Mostrando {filtered.length} ejercicio{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => (
          <div
            key={ex.id}
            onClick={() => setSelected(ex)}
            className="rounded-lg overflow-hidden cursor-pointer transition-all"
            style={{ border: '1px solid #111', backgroundColor: '#000' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1a3a1a')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#111')}
          >
            <div
              className="w-full flex items-center justify-center"
              style={{ aspectRatio: '1 / 1', backgroundColor: '#0d0d0d', overflow: 'hidden' }}
            >
              {ex.images[0] ? (
                <img
                  src={ex.images[0]}
                  alt={ex.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div style={{
                display: ex.images[0] ? 'none' : 'flex',
                width: '100%', height: '100%',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="text-xs capitalize" style={{ color: '#333' }}>{ex.bodyPart}</span>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium mb-2 capitalize" style={{ color: '#fff' }}>{ex.name}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e33' }}>
                  {ex.bodyPart}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: '#0d0d0d', color: '#555', border: '1px solid #1a1a1a' }}>
                  {ex.equipment}
                </span>
                {ex.level && (
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor: '#0d0d0d',
                      color: LEVEL_COLOR[ex.level] ?? '#444',
                      border: '1px solid #1a1a1a',
                    }}>
                    {ex.level}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-sm" style={{ color: '#333' }}>No se encontraron ejercicios</p>
          </div>
        )}
      </div>

      {selected && (
        <ExerciseDrawer exercise={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

function TabMiRutina() {
  const [rutina, setRutina] = useState(null)
  const [completados, setCompletados] = useState([])
  const [diaActivo, setDiaActivo] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  const cargarCompletados = useCallback(async (rutina_id) => {
    const { data } = await getCompletadosRutina(rutina_id)
    setCompletados(data)
  }, [])

  useEffect(() => {
    getMiRutina()
      .then(({ data }) => {
        setRutina(data)
        if (data) cargarCompletados(data.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cargarCompletados])

  const isCompletado = (dia_numero, ejercicio_nombre) =>
    completados.some(c => c.dia_numero === dia_numero && c.ejercicio_nombre === ejercicio_nombre)

  const handleToggle = async (dia_numero, ejercicio_nombre) => {
    const key = `${dia_numero}-${ejercicio_nombre}`
    setToggling(key)
    try {
      const { data } = await toggleEjercicio({ rutina_id: rutina.id, dia_numero, ejercicio_nombre })
      if (data.completado) {
        setCompletados(prev => [...prev, { dia_numero, ejercicio_nombre }])
      } else {
        setCompletados(prev => prev.filter(c => !(c.dia_numero === dia_numero && c.ejercicio_nombre === ejercicio_nombre)))
      }
    } catch {}
    setToggling(null)
  }

  if (loading) return <p className="text-sm py-8" style={{ color: '#444' }}>Cargando...</p>

  if (!rutina) {
    return (
      <div style={cardStyle}>
        <p className="text-sm text-center py-6" style={{ color: '#444' }}>
          No tenés una rutina asignada todavía.
        </p>
        <p className="text-xs text-center" style={{ color: '#333' }}>Tu entrenador te asignará una cuando esté lista.</p>
      </div>
    )
  }

  const dia = rutina.ejercicios[diaActivo]
  const completadosHoy = dia.ejercicios.filter(e => isCompletado(dia.dia, e.nombre)).length

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm font-medium" style={{ color: '#fff' }}>{rutina.nombre}</p>
        <p className="text-xs mt-0.5" style={{ color: '#555' }}>{rutina.objetivo} · {rutina.dias_semana} días/semana</p>
      </div>

      {/* Selector de días */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {rutina.ejercicios.map((d, i) => {
          const comp = d.ejercicios.filter(e => isCompletado(d.dia, e.nombre)).length
          const isActive = i === diaActivo
          return (
            <button key={d.dia} onClick={() => setDiaActivo(i)}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: isActive ? '#0a1a0a' : '#0d0d0d',
                border: isActive ? '1px solid #22c55e' : '1px solid #111',
                color: isActive ? '#22c55e' : '#555',
              }}>
              {d.nombre}
              {comp > 0 && <span className="ml-1.5">·{comp}/{d.ejercicios.length}</span>}
            </button>
          )
        })}
      </div>

      {/* Barra de progreso */}
      <div className="mb-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-widest" style={{ color: '#333' }}>Progreso de hoy</span>
          <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>{completadosHoy}/{dia.ejercicios.length}</span>
        </div>
        <div className="w-full rounded-full" style={{ height: '4px', backgroundColor: '#111' }}>
          <div className="rounded-full transition-all" style={{
            width: dia.ejercicios.length ? `${(completadosHoy / dia.ejercicios.length) * 100}%` : '0%',
            height: '4px', backgroundColor: '#22c55e',
          }} />
        </div>
      </div>

      {/* Lista de ejercicios */}
      <div className="flex flex-col gap-2">
        {dia.ejercicios.length === 0 ? (
          <p className="text-sm" style={{ color: '#444' }}>No hay ejercicios para este día.</p>
        ) : dia.ejercicios.map((ej) => {
          const done = isCompletado(dia.dia, ej.nombre)
          const key = `${dia.dia}-${ej.nombre}`
          return (
            <button key={key}
              onClick={() => handleToggle(dia.dia, ej.nombre)}
              disabled={toggling === key}
              className="flex items-center gap-4 text-left transition-all"
              style={{
                border: done ? '1px solid #22c55e44' : '1px solid #111',
                borderRadius: '8px',
                backgroundColor: done ? '#0a1a0a' : '#000',
                padding: '14px 16px',
                opacity: toggling === key ? 0.6 : 1,
              }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                border: done ? '2px solid #22c55e' : '2px solid #333',
                backgroundColor: done ? '#22c55e' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done && <span style={{ color: '#000', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium"
                  style={{ color: done ? '#22c55e' : '#fff', textDecoration: done ? 'line-through' : 'none' }}>
                  {ej.nombre}
                </p>
                {(ej.series || ej.reps) && (
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                    {[ej.series && `${ej.series} series`, ej.reps && `${ej.reps} reps`].filter(Boolean).join(' × ')}
                  </p>
                )}
                {ej.notas && <p className="text-xs mt-0.5 truncate" style={{ color: '#444' }}>{ej.notas}</p>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Ejercicios() {
  const [tab, setTab] = useState('explorar')

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '960px' }}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Ejercicios</h1>
          <p className="text-sm mt-1" style={{ color: '#333' }}>
            {tab === 'explorar' ? 'Explorá más de 1300 ejercicios con animaciones' : 'Tu rutina asignada de hoy'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid #111', paddingBottom: '0' }}>
          {[
            { key: 'explorar', label: 'Explorar' },
            { key: 'registros', label: 'Mi rutina' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-sm font-medium px-4 py-2 transition-colors"
              style={{
                color: tab === key ? '#22c55e' : '#555',
                borderBottom: tab === key ? '2px solid #22c55e' : '2px solid transparent',
                marginBottom: '-1px',
                background: 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'explorar' ? <TabExplorar /> : <TabMiRutina />}

      </div>
    </AppLayout>
  )
}
