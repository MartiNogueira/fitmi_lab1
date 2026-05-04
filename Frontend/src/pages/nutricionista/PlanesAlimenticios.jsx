import { useState, useEffect } from 'react'
import AppLayout from '../../components/AppLayout'
import { getPlanes, createPlan, updatePlan, deletePlan, getMisClientes } from '../../api/auth'
import { Plus, Trash2 } from 'lucide-react'

const MOMENTOS = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack']

const inputStyle = {
  backgroundColor: '#111',
  border: '1px solid #222',
  borderRadius: '6px',
  padding: '8px 12px',
  color: '#fff',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
}

function buildDias(n) {
  return Array.from({ length: n }, (_, i) => ({
    dia: i + 1,
    nombre: `Día ${i + 1}`,
    comidas: [{ nombre: '', momento: 'desayuno', descripcion: '' }],
  }))
}

function PlanModal({ initial, onClose, onSave, clientes }) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [objetivo, setObjetivo] = useState(initial?.objetivo ?? '')
  const [cantDias, setCantDias] = useState(initial?.dias?.length ?? 7)
  const [dias, setDias] = useState(initial?.dias ?? buildDias(7))
  const [usuarioEmail, setUsuarioEmail] = useState(initial?.usuario?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCantDias = (val) => {
    const n = Math.min(14, Math.max(1, Number(val)))
    setCantDias(n)
    setDias((prev) => {
      if (n > prev.length) return [...prev, ...buildDias(n).slice(prev.length)]
      return prev.slice(0, n)
    })
  }

  const updateDiaNombre = (dIdx, val) =>
    setDias(prev => prev.map((d, i) => i === dIdx ? { ...d, nombre: val } : d))

  const updateComida = (dIdx, cIdx, field, val) =>
    setDias(prev => prev.map((d, i) => {
      if (i !== dIdx) return d
      return { ...d, comidas: d.comidas.map((c, j) => j === cIdx ? { ...c, [field]: val } : c) }
    }))

  const addComida = (dIdx) =>
    setDias(prev => prev.map((d, i) =>
      i === dIdx ? { ...d, comidas: [...d.comidas, { nombre: '', momento: 'desayuno', descripcion: '' }] } : d
    ))

  const removeComida = (dIdx, cIdx) =>
    setDias(prev => prev.map((d, i) =>
      i === dIdx ? { ...d, comidas: d.comidas.filter((_, j) => j !== cIdx) } : d
    ))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !objetivo.trim()) {
      setError('Nombre y objetivo son requeridos')
      return
    }
    const diasLimpios = dias.map((d) => ({
      ...d,
      comidas: d.comidas.filter((c) => c.nombre.trim()),
    }))
    setLoading(true)
    setError('')
    try {
      await onSave({
        nombre,
        objetivo,
        dias: diasLimpios,
        usuario_email: usuarioEmail.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Error al guardar el plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl mx-4 rounded-lg p-6 flex flex-col gap-4"
        style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="text-base font-semibold" style={{ color: '#fff' }}>
          {initial ? 'Editar plan' : 'Nuevo plan alimenticio'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Plan déficit calórico" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Objetivo</label>
              <input value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="Ej: Pérdida de peso" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Cantidad de días</label>
              <input type="number" min="1" max="14" value={cantDias}
                onChange={e => handleCantDias(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Asignar a</label>
              <select value={usuarioEmail} onChange={e => setUsuarioEmail(e.target.value)} style={inputStyle}>
                <option value="">Sin asignar</option>
                {clientes.map(c => (
                  <option key={c.id_usuario} value={c.email}>{c.nombre_usuario}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {dias.map((dia, dIdx) => (
              <div key={dIdx} style={{ border: '1px solid #1a1a1a', borderRadius: '8px', padding: '12px' }}>
                <input
                  value={dia.nombre}
                  onChange={e => updateDiaNombre(dIdx, e.target.value)}
                  style={{ ...inputStyle, backgroundColor: 'transparent', border: 'none', padding: '0 0 8px 0', fontSize: '13px', color: '#22c55e', fontWeight: '600' }}
                />
                <div className="flex flex-col gap-2">
                  {dia.comidas.map((comida, cIdx) => (
                    <div key={cIdx} className="flex gap-2 items-center">
                      <input value={comida.nombre} onChange={e => updateComida(dIdx, cIdx, 'nombre', e.target.value)}
                        placeholder="Comida" style={{ ...inputStyle, flex: 2 }} />
                      <select value={comida.momento} onChange={e => updateComida(dIdx, cIdx, 'momento', e.target.value)}
                        style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                        {MOMENTOS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input value={comida.descripcion} onChange={e => updateComida(dIdx, cIdx, 'descripcion', e.target.value)}
                        placeholder="Descripción (opcional)" style={{ ...inputStyle, flex: 2 }} />
                      {dia.comidas.length > 1 && (
                        <button type="button" onClick={() => removeComida(dIdx, cIdx)}>
                          <Trash2 size={14} color="#555" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addComida(dIdx)}
                  className="mt-2 text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
                  <Plus size={12} /> Agregar comida
                </button>
              </div>
            ))}
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
  const [clientes, setClientes] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
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

  useEffect(() => {
    fetchPlanes()
    getMisClientes().then(({ data }) => setClientes(data)).catch(() => {})
  }, [])

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
              {loading ? '...' : `${planes.length} plan${planes.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
          <button onClick={() => setModal({ mode: 'create' })}
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
            <button onClick={() => setModal({ mode: 'create' })} className="mt-3 text-sm" style={{ color: '#22c55e' }}>
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
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: '#555' }}>{plan.dias.length} días</span>
                      {plan.usuario ? (
                        <span className="text-xs" style={{ color: '#22c55e' }}>→ {plan.usuario.nombre_usuario}</span>
                      ) : (
                        <span className="text-xs" style={{ color: '#444' }}>Sin asignar</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#444' }}>{expanded === plan.id ? '▲' : '▼'}</span>
                </div>

                {expanded === plan.id && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid #111' }}>
                    {plan.dias.map((dia) => (
                      <div key={dia.dia} className="mt-3">
                        <p className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>{dia.nombre}</p>
                        {dia.comidas.length === 0 ? (
                          <p className="text-xs" style={{ color: '#444' }}>Sin comidas</p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {dia.comidas.map((c, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs px-1.5 py-0.5 rounded capitalize"
                                  style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e33', flexShrink: 0 }}>
                                  {c.momento}
                                </span>
                                <span className="text-sm" style={{ color: '#ccc' }}>{c.nombre}</span>
                                {c.descripcion && <span className="text-xs truncate" style={{ color: '#555' }}>{c.descripcion}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setModal({ mode: 'edit', plan })}
                        className="flex-1 py-2 text-sm font-semibold rounded-md"
                        style={{ border: '1px solid #22c55e44', color: '#22c55e', backgroundColor: '#0a1a0a' }}>
                        Editar
                      </button>
                      <button onClick={() => setDeleteConfirm(plan.id)}
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
          initial={modal.mode === 'edit' ? modal.plan : undefined}
          onClose={() => setModal(null)}
          onSave={modal.mode === 'create' ? handleCreate : handleUpdate}
          clientes={clientes}
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
