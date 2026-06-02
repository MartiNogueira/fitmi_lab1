import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { createRutina, getRutinas, updateRutina } from '../api/auth'

const inputStyle = {
  backgroundColor: '#111',
  border: '1px solid #222',
  borderRadius: '6px',
  padding: '10px 12px',
  color: '#fff',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
}

function buildDias(cantidad) {
  return Array.from({ length: cantidad }, (_, index) => ({
    dia: index + 1,
    nombre: `Día ${index + 1}`,
    ejercicios: [{ nombre: '', series: '', reps: '', notas: '' }],
  }))
}

export default function CrearRutina() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [nombre, setNombre] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [diasSemana, setDiasSemana] = useState(3)
  const [dias, setDias] = useState(() => buildDias(3))
  const [loadingRutina, setLoadingRutina] = useState(isEditing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEditing) return

    getRutinas()
      .then(({ data }) => {
        const rutina = data.find((item) => item.id === Number(id))
        if (!rutina) {
          setError('No se encontró la rutina')
          return
        }
        const ejercicios = Array.isArray(rutina.ejercicios) && rutina.ejercicios.length
          ? rutina.ejercicios
          : buildDias(rutina.dias_semana || 1)

        setNombre(rutina.nombre ?? '')
        setObjetivo(rutina.objetivo ?? '')
        setDiasSemana(rutina.dias_semana ?? ejercicios.length)
        setDias(ejercicios)
      })
      .catch(() => setError('No se pudo cargar la rutina'))
      .finally(() => setLoadingRutina(false))
  }, [id, isEditing])

  const handleDiasSemanaChange = (value) => {
    const cantidad = Math.min(7, Math.max(1, Number(value) || 1))
    setDiasSemana(cantidad)
    setDias((prev) => {
      if (cantidad > prev.length) {
        return [...prev, ...buildDias(cantidad).slice(prev.length)]
      }
      return prev.slice(0, cantidad)
    })
  }

  const updateDiaNombre = (diaIndex, value) => {
    setDias((prev) => prev.map((dia, index) => (
      index === diaIndex ? { ...dia, nombre: value } : dia
    )))
  }

  const updateEjercicio = (diaIndex, ejercicioIndex, field, value) => {
    setDias((prev) => prev.map((dia, index) => {
      if (index !== diaIndex) return dia
      return {
        ...dia,
        ejercicios: dia.ejercicios.map((ejercicio, innerIndex) => (
          innerIndex === ejercicioIndex ? { ...ejercicio, [field]: value } : ejercicio
        )),
      }
    }))
  }

  const addEjercicio = (diaIndex) => {
    setDias((prev) => prev.map((dia, index) => (
      index === diaIndex
        ? { ...dia, ejercicios: [...dia.ejercicios, { nombre: '', series: '', reps: '', notas: '' }] }
        : dia
    )))
  }

  const removeEjercicio = (diaIndex, ejercicioIndex) => {
    setDias((prev) => prev.map((dia, index) => (
      index === diaIndex
        ? { ...dia, ejercicios: dia.ejercicios.filter((_, innerIndex) => innerIndex !== ejercicioIndex) }
        : dia
    )))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const ejerciciosLimpios = dias.map((dia) => ({
      ...dia,
      ejercicios: dia.ejercicios
        .filter((ejercicio) => ejercicio.nombre.trim())
        .map((ejercicio) => ({
          nombre: ejercicio.nombre.trim(),
          series: ejercicio.series,
          reps: ejercicio.reps,
          notas: ejercicio.notas.trim(),
        })),
    }))

    const totalEjercicios = ejerciciosLimpios.reduce((total, dia) => total + dia.ejercicios.length, 0)

    if (!nombre.trim() || !objetivo.trim()) {
      setError('Completá el nombre y el objetivo de la rutina')
      return
    }

    if (totalEjercicios === 0) {
      setError('Agregá al menos un ejercicio')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        nombre: nombre.trim(),
        objetivo: objetivo.trim(),
        dias_semana: diasSemana,
        ejercicios: ejerciciosLimpios,
      }

      if (isEditing) {
        await updateRutina(id, payload)
      } else {
        await createRutina(payload)
      }
      navigate('/rutinas')
    } catch (err) {
      setError(err?.response?.data?.error ?? `No se pudo ${isEditing ? 'actualizar' : 'crear'} la rutina`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingRutina) {
    return (
      <AppLayout>
        <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '960px' }}>
          <p className="text-sm" style={{ color: '#444' }}>Cargando rutina...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '960px' }}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/rutinas')}
              className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md transition-opacity hover:opacity-75"
              style={{ border: '1px solid #222', color: '#777', backgroundColor: '#0d0d0d' }}
              aria-label="Volver a rutinas"
            >
              <ArrowLeft size={17} />
            </button>
            <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>{isEditing ? 'Editar rutina' : 'Crear rutina'}</h1>
            <p className="text-sm mt-1" style={{ color: '#444' }}>
              {isEditing ? 'Modificá los días, ejercicios y detalles de tu rutina.' : 'Armá tus días de entrenamiento con ejercicios, series, reps y notas.'}
            </p>
          </div>
          <button
            type="submit"
            form="crear-rutina-form"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-60"
            style={{ backgroundColor: '#22c55e', color: '#000' }}
          >
            <Save size={16} />
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar rutina'}
          </button>
        </div>

        <form id="crear-rutina-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_160px]">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: '#555' }}>
                Nombre
              </label>
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej: Fuerza 4 días"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: '#555' }}>
                Objetivo
              </label>
              <input
                value={objetivo}
                onChange={(event) => setObjetivo(event.target.value)}
                placeholder="Ej: Hipertrofia"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: '#555' }}>
                Días
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={diasSemana}
                onChange={(event) => handleDiasSemanaChange(event.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {dias.map((dia, diaIndex) => (
              <section
                key={dia.dia}
                className="rounded-lg p-4"
                style={{ border: '1px solid #111', backgroundColor: '#000' }}
              >
                <input
                  value={dia.nombre}
                  onChange={(event) => updateDiaNombre(diaIndex, event.target.value)}
                  className="mb-3 font-semibold"
                  style={{ ...inputStyle, backgroundColor: 'transparent', border: 'none', padding: 0, color: '#22c55e' }}
                />

                <div className="flex flex-col gap-2">
                  {dia.ejercicios.map((ejercicio, ejercicioIndex) => (
                    <div key={ejercicioIndex} className="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_100px_100px_1fr_38px]">
                      <input
                        value={ejercicio.nombre}
                        onChange={(event) => updateEjercicio(diaIndex, ejercicioIndex, 'nombre', event.target.value)}
                        placeholder="Ejercicio"
                        style={inputStyle}
                      />
                      <input
                        type="number"
                        min="0"
                        value={ejercicio.series}
                        onChange={(event) => updateEjercicio(diaIndex, ejercicioIndex, 'series', event.target.value)}
                        placeholder="Series"
                        style={inputStyle}
                      />
                      <input
                        value={ejercicio.reps}
                        onChange={(event) => updateEjercicio(diaIndex, ejercicioIndex, 'reps', event.target.value)}
                        placeholder="Reps"
                        style={inputStyle}
                      />
                      <input
                        value={ejercicio.notas}
                        onChange={(event) => updateEjercicio(diaIndex, ejercicioIndex, 'notas', event.target.value)}
                        placeholder="Notas"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => removeEjercicio(diaIndex, ejercicioIndex)}
                        disabled={dia.ejercicios.length === 1}
                        className="flex h-10 items-center justify-center rounded-md transition-opacity hover:opacity-75 disabled:opacity-25"
                        style={{ border: '1px solid #222', color: '#777', backgroundColor: '#0d0d0d' }}
                        aria-label="Eliminar ejercicio"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addEjercicio(diaIndex)}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: '#22c55e' }}
                >
                  <Plus size={15} />
                  Agregar ejercicio
                </button>
              </section>
            ))}
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#ef4444' }}>
              {error}
            </p>
          )}
        </form>
      </div>
    </AppLayout>
  )
}
