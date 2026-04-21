import { useState, useEffect } from 'react'
import AppLayout from '../../components/AppLayout'
import { getPlanes, createPlan, updatePlan, deletePlan } from '../../api/auth'

const emptyForm = { nombre: '', calorias: '', objetivo: '', comidas: [''] }

function PlanModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ?? emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const setComida = (i, value) =>
    setForm(f => ({ ...f, comidas: f.comidas.map((c, idx) => idx === i ? value : c) }))

  const addComida = () => setForm(f => ({ ...f, comidas: [...f.comidas, ''] }))

  const removeComida = (i) =>
    setForm(f => ({ ...f, comidas: f.comidas.filter((_, idx) => idx !== i) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.calorias.trim() || !form.objetivo.trim()) {
      setError('Nombre, calorías y objetivo son requeridos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = { ...form, comidas: form.comidas.filter(c => c.trim()) }
      await onSave(data)
      onClose()
    } catch {
      setError('Error al guardar el plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg mx-4 rounded-lg p-6 flex flex-col gap-4"
        style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="text-base font-semibold" style={{ color: '#fff' }}>
          {initial ? 'Editar plan' : 'Nuevo plan alimenticio'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Nombre</label>
            <input
              value={form.nombre}
              onChange={e => setField('nombre', e.target.value)}
              placeholder="Ej: Plan déficit calórico"
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Calorías</label>
              <input
                value={form.calorias}
                onChange={e => setField('calorias', e.target.value)}
                placeholder="Ej: 1800 kcal/día"
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Objetivo</label>
              <input
                value={form.objetivo}
                onChange={e => setField('objetivo', e.target.value)}
                placeholder="Ej: Pérdida de peso"
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs uppercase tracking-widest" style={{ color: '#555' }}>Comidas del día</label>
              <button type="button" onClick={addComida}
                className="text-xs px-2 py-0.5 rounded"
                style={{ color: '#22c55e', border: '1px solid #22c55e44', backgroundColor: '#0a1a0a' }}>
                + Agregar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {form.comidas.map((comida, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={comida}
                    onChange={e => setComida(i, e.target.value)}
                    placeholder={`Comida ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-md text-sm outline-none"
                    style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
                  />
                  {form.comidas.length > 1 && (
                    <button type="button" onClick={() => removeComida(i)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: '#ef4444', border: '1px solid #ef444433', backgroundColor: '#1a0a0a' }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
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

export default function PlanesAlimenticios() {
  const [planes, setPlanes] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [modal, setModal] = useState(null) // null | { mode: 'create' } | { mode: 'edit', plan }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // plan id
  const [loading, setLoading] = useState(true)

  const fetchPlanes = async () => {
    try {
      const res = await getPlanes()
      setPlanes(res.data)
    } catch {
      setPlanes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlanes() }, [])

  const handleCreate = async (data) => {
    const res = await createPlan(data)
    setPlanes(prev => [res.data, ...prev])
  }

  const handleUpdate = async (data) => {
    const res = await updatePlan(modal.plan.id, data)
    setPlanes(prev => prev.map(p => p.id === res.data.id ? res.data : p))
  }

  const handleDelete = async (id) => {
    await deletePlan(id)
    setPlanes(prev => prev.filter(p => p.id !== id))
    setExpanded(null)
    setDeleteConfirm(null)
  }

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="flex items-center justify-between mb-6" style={{ maxWidth: '720px' }}>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Planes alimenticios</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>
              {loading ? '...' : `${planes.length} plan${planes.length !== 1 ? 'es' : ''} activo${planes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="px-4 py-2 text-sm font-semibold rounded-md"
            style={{ backgroundColor: '#22c55e', color: '#000' }}>
            + Nuevo plan
          </button>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: '#444' }}>Cargando...</p>
        ) : planes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ maxWidth: '720px' }}>
            <p className="text-sm" style={{ color: '#444' }}>No hay planes creados aún.</p>
            <button onClick={() => setModal({ mode: 'create' })}
              className="mt-3 text-sm" style={{ color: '#22c55e' }}>
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3" style={{ maxWidth: '720px' }}>
            {planes.map((plan) => (
              <div key={plan.id} style={{ border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000', overflow: 'hidden' }}>
                <div className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: '#fff' }}>{plan.nombre}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        {plan.objetivo}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#666' }}>{plan.calorias}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#444' }}>{expanded === plan.id ? '▲' : '▼'}</span>
                </div>

                {expanded === plan.id && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid #111' }}>
                    <p className="text-xs font-semibold mt-3 mb-2 uppercase tracking-widest" style={{ color: '#444' }}>Comidas del día</p>
                    {plan.comidas.length === 0 ? (
                      <p className="text-sm mb-4" style={{ color: '#555' }}>Sin comidas registradas.</p>
                    ) : (
                      <div className="flex flex-col gap-1 mb-4">
                        {plan.comidas.map((meal, i) => (
                          <p key={i} className="text-sm" style={{ color: '#aaa' }}>· {meal}</p>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal({ mode: 'edit', plan })}
                        className="flex-1 py-2 text-sm font-semibold rounded-md"
                        style={{ border: '1px solid #22c55e44', color: '#22c55e', backgroundColor: '#0a1a0a' }}>
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(plan.id)}
                        className="px-4 py-2 text-sm font-semibold rounded-md"
                        style={{ border: '1px solid #ef444433', color: '#ef4444', backgroundColor: '#1a0a0a' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <PlanModal
          initial={modal.mode === 'edit' ? {
            nombre: modal.plan.nombre,
            calorias: modal.plan.calorias,
            objetivo: modal.plan.objetivo,
            comidas: modal.plan.comidas.length ? modal.plan.comidas : [''],
          } : undefined}
          onClose={() => setModal(null)}
          onSave={modal.mode === 'create' ? handleCreate : handleUpdate}
        />
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm mx-4 rounded-lg p-6 flex flex-col gap-4"
            style={{ backgroundColor: '#0d0d0d', border: '1px solid #222' }}>
            <p className="text-sm" style={{ color: '#fff' }}>¿Eliminar este plan? Esta acción no se puede deshacer.</p>
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
