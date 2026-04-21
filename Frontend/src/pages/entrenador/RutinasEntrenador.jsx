import { useState, useEffect, useMemo } from 'react'
import AppLayout from '../../components/AppLayout'
import { getRutinas, createRutina, updateRutina, deleteRutina } from '../../api/auth'
import { ALL_EXERCISES, MUSCLE_GROUPS } from '../../data/ejercicios'

const emptyForm = { nombre: '', objetivo: '', dias: '', ejercicios: [] }

function EjercicioPicker({ selected, onChange }) {
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('Todos')

  const filtered = useMemo(() =>
    ALL_EXERCISES.filter(ex => {
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      const matchGroup = activeGroup === 'Todos' || ex.muscle === activeGroup
      return matchSearch && matchGroup
    }), [search, activeGroup])

  const toggle = (name) => {
    if (selected.includes(name)) {
      onChange(selected.filter(e => e !== name))
    } else {
      onChange([...selected, name])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar ejercicio..."
        className="w-full px-3 py-2 rounded-md text-sm outline-none"
        style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
      />
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_GROUPS.map(g => (
          <button key={g} type="button" onClick={() => setActiveGroup(g)}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: activeGroup === g ? '#0a1a0a' : 'transparent',
              border: activeGroup === g ? '1px solid #22c55e44' : '1px solid #1a1a1a',
              color: activeGroup === g ? '#22c55e' : '#555',
            }}>
            {g}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: '200px' }}>
        {filtered.length === 0 && (
          <p className="text-xs py-3 text-center" style={{ color: '#444' }}>Sin resultados</p>
        )}
        {filtered.map(ex => {
          const isSelected = selected.includes(ex.name)
          return (
            <button key={ex.name} type="button" onClick={() => toggle(ex.name)}
              className="flex items-center justify-between px-3 py-2 rounded-md text-left"
              style={{
                backgroundColor: isSelected ? '#0a1a0a' : '#111',
                border: isSelected ? '1px solid #22c55e44' : '1px solid #1a1a1a',
              }}>
              <div>
                <span className="text-sm" style={{ color: isSelected ? '#22c55e' : '#ccc' }}>{ex.name}</span>
                <span className="text-xs ml-2" style={{ color: '#444' }}>{ex.muscle}</span>
              </div>
              {isSelected && <span className="text-xs" style={{ color: '#22c55e' }}>✓</span>}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs" style={{ color: '#22c55e' }}>{selected.length} ejercicio{selected.length !== 1 ? 's' : ''} seleccionado{selected.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}

function RutinaModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ?? emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.objetivo.trim() || !form.dias) {
      setError('Nombre, objetivo y días son requeridos')
      return
    }
    if (isNaN(Number(form.dias)) || Number(form.dias) < 1 || Number(form.dias) > 7) {
      setError('Los días deben ser entre 1 y 7')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSave({ ...form, dias: Number(form.dias) })
      onClose()
    } catch {
      setError('Error al guardar la rutina')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg mx-4 rounded-lg p-6 flex flex-col gap-4"
        style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="text-base font-semibold" style={{ color: '#fff' }}>
          {initial ? 'Editar rutina' : 'Nueva rutina'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Nombre</label>
            <input
              value={form.nombre}
              onChange={e => setField('nombre', e.target.value)}
              placeholder="Ej: Fuerza 4 días"
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Objetivo</label>
              <input
                value={form.objetivo}
                onChange={e => setField('objetivo', e.target.value)}
                placeholder="Ej: Hipertrofia"
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
              />
            </div>
            <div style={{ width: '100px' }}>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Días/semana</label>
              <input
                type="number" min="1" max="7"
                value={form.dias}
                onChange={e => setField('dias', e.target.value)}
                placeholder="1-7"
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest mb-2 block" style={{ color: '#555' }}>Ejercicios</label>
            <EjercicioPicker
              selected={form.ejercicios}
              onChange={val => setField('ejercicios', val)}
            />
          </div>

          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm rounded-md"
              style={{ border: '1px solid #222', color: '#666', backgroundColor: 'transparent' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 text-sm font-semibold rounded-md"
              style={{ backgroundColor: '#22c55e', color: '#000', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RutinasEntrenador() {
  const [rutinas, setRutinas] = useState([])
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRutinas = async () => {
    try {
      const res = await getRutinas()
      setRutinas(res.data)
    } catch {
      setRutinas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRutinas() }, [])

  const handleCreate = async (data) => {
    const res = await createRutina(data)
    setRutinas(prev => [res.data, ...prev])
  }

  const handleUpdate = async (data) => {
    const res = await updateRutina(modal.rutina.id, data)
    setRutinas(prev => prev.map(r => r.id === res.data.id ? res.data : r))
  }

  const handleDelete = async (id) => {
    await deleteRutina(id)
    setRutinas(prev => prev.filter(r => r.id !== id))
    setSelected(null)
    setDeleteConfirm(null)
  }

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6 flex items-center justify-between" style={{ maxWidth: '960px' }}>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Rutinas</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>
              {loading ? '...' : `${rutinas.length} rutina${rutinas.length !== 1 ? 's' : ''} creada${rutinas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="px-4 py-2 text-sm font-semibold rounded-md"
            style={{ backgroundColor: '#22c55e', color: '#000' }}>
            + Nueva rutina
          </button>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: '#444' }}>Cargando...</p>
        ) : rutinas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ maxWidth: '960px' }}>
            <p className="text-sm" style={{ color: '#444' }}>No hay rutinas creadas aún.</p>
            <button onClick={() => setModal({ mode: 'create' })}
              className="mt-3 text-sm" style={{ color: '#22c55e' }}>
              Crear la primera
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3" style={{ maxWidth: '960px' }}>
            {rutinas.map((rutina) => (
              <div key={rutina.id}
                style={{
                  border: selected === rutina.id ? '1px solid #22c55e44' : '1px solid #111',
                  borderRadius: '8px', backgroundColor: '#000', padding: '16px', cursor: 'pointer'
                }}
                onClick={() => setSelected(selected === rutina.id ? null : rutina.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium" style={{ color: '#fff' }}>{rutina.nombre}</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: '#666' }}>{rutina.objetivo}</span>
                      <span className="text-xs" style={{ color: '#444' }}>·</span>
                      <span className="text-xs" style={{ color: '#666' }}>{rutina.dias} días/semana</span>
                      <span className="text-xs" style={{ color: '#444' }}>·</span>
                      <span className="text-xs" style={{ color: '#666' }}>{rutina.ejercicios.length} ejercicios</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 text-xs font-medium rounded-md"
                      style={{ border: '1px solid #222', color: '#aaa', backgroundColor: '#0d0d0d' }}
                      onClick={e => { e.stopPropagation(); setModal({ mode: 'edit', rutina }) }}>
                      Editar
                    </button>
                    <button
                      className="px-3 py-1.5 text-xs font-medium rounded-md"
                      style={{ border: '1px solid #ef444433', color: '#ef4444', backgroundColor: '#1a0a0a' }}
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(rutina.id) }}>
                      Eliminar
                    </button>
                  </div>
                </div>

                {selected === rutina.id && rutina.ejercicios.length > 0 && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid #111' }}>
                    <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#444' }}>Ejercicios</p>
                    <div className="flex flex-col gap-1">
                      {rutina.ejercicios.map((ej, i) => (
                        <p key={i} className="text-sm" style={{ color: '#aaa' }}>· {ej}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <RutinaModal
          initial={modal.mode === 'edit' ? {
            nombre: modal.rutina.nombre,
            objetivo: modal.rutina.objetivo,
            dias: String(modal.rutina.dias),
            ejercicios: modal.rutina.ejercicios,
          } : undefined}
          onClose={() => setModal(null)}
          onSave={modal.mode === 'create' ? handleCreate : handleUpdate}
        />
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm mx-4 rounded-lg p-6 flex flex-col gap-4"
            style={{ backgroundColor: '#0d0d0d', border: '1px solid #222' }}>
            <p className="text-sm" style={{ color: '#fff' }}>¿Eliminar esta rutina? Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 text-sm rounded-md"
                style={{ border: '1px solid #222', color: '#666' }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 text-sm font-semibold rounded-md"
                style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
