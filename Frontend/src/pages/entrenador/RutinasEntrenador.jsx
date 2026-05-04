import { useState, useEffect } from 'react'
import AppLayout from '../../components/AppLayout'
import { getRutinas, createRutina, updateRutina, deleteRutina, getMisClientes } from '../../api/auth'
import { Plus, Trash2 } from 'lucide-react'

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
    ejercicios: [{ nombre: '', series: '', reps: '', notas: '' }],
  }))
}

function RutinaModal({ initial, onClose, onSave, clientes }) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [objetivo, setObjetivo] = useState(initial?.objetivo ?? '')
  const [diasSemana, setDiasSemana] = useState(initial?.dias_semana ?? 3)
  const [dias, setDias] = useState(initial?.ejercicios ?? buildDias(3))
  const [usuarioEmail, setUsuarioEmail] = useState(initial?.usuario?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDiasSemanaChange = (val) => {
    const n = Math.min(7, Math.max(1, Number(val)))
    setDiasSemana(n)
    setDias((prev) => {
      if (n > prev.length) {
        return [...prev, ...buildDias(n).slice(prev.length)]
      }
      return prev.slice(0, n)
    })
  }

  const updateDiaNombre = (dIdx, val) => {
    setDias((prev) => prev.map((d, i) => i === dIdx ? { ...d, nombre: val } : d))
  }

  const updateEjercicio = (dIdx, eIdx, field, val) => {
    setDias((prev) => prev.map((d, i) => {
      if (i !== dIdx) return d
      return {
        ...d,
        ejercicios: d.ejercicios.map((e, j) => j === eIdx ? { ...e, [field]: val } : e),
      }
    }))
  }

  const addEjercicio = (dIdx) => {
    setDias((prev) => prev.map((d, i) =>
      i === dIdx ? { ...d, ejercicios: [...d.ejercicios, { nombre: '', series: '', reps: '', notas: '' }] } : d
    ))
  }

  const removeEjercicio = (dIdx, eIdx) => {
    setDias((prev) => prev.map((d, i) =>
      i === dIdx ? { ...d, ejercicios: d.ejercicios.filter((_, j) => j !== eIdx) } : d
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !objetivo.trim()) {
      setError('Nombre y objetivo son requeridos')
      return
    }
    const ejerciciosLimpios = dias.map((d) => ({
      ...d,
      ejercicios: d.ejercicios.filter((e) => e.nombre.trim()),
    }))
    setLoading(true)
    setError('')
    try {
      await onSave({
        nombre,
        objetivo,
        dias_semana: diasSemana,
        ejercicios: ejerciciosLimpios,
        usuario_email: usuarioEmail.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Error al guardar la rutina')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl mx-4 rounded-lg p-6 flex flex-col gap-4"
        style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="text-base font-semibold" style={{ color: '#fff' }}>
          {initial ? 'Editar rutina' : 'Nueva rutina'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Fuerza 4 días" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Objetivo</label>
              <input value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="Ej: Hipertrofia" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: '#555' }}>Días / semana</label>
              <input type="number" min="1" max="7" value={diasSemana}
                onChange={e => handleDiasSemanaChange(e.target.value)} style={inputStyle} />
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
                  className="font-medium mb-3"
                  style={{ ...inputStyle, backgroundColor: 'transparent', border: 'none', padding: '0', fontSize: '13px', color: '#22c55e' }}
                />
                <div className="flex flex-col gap-2">
                  {dia.ejercicios.map((ej, eIdx) => (
                    <div key={eIdx} className="flex gap-2 items-center">
                      <input value={ej.nombre} onChange={e => updateEjercicio(dIdx, eIdx, 'nombre', e.target.value)}
                        placeholder="Ejercicio" style={{ ...inputStyle, flex: 2 }} />
                      <input type="number" value={ej.series} onChange={e => updateEjercicio(dIdx, eIdx, 'series', e.target.value)}
                        placeholder="Series" style={{ ...inputStyle, flex: 1 }} />
                      <input type="number" value={ej.reps} onChange={e => updateEjercicio(dIdx, eIdx, 'reps', e.target.value)}
                        placeholder="Reps" style={{ ...inputStyle, flex: 1 }} />
                      <input value={ej.notas} onChange={e => updateEjercicio(dIdx, eIdx, 'notas', e.target.value)}
                        placeholder="Notas" style={{ ...inputStyle, flex: 2 }} />
                      {dia.ejercicios.length > 1 && (
                        <button type="button" onClick={() => removeEjercicio(dIdx, eIdx)}>
                          <Trash2 size={14} color="#555" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addEjercicio(dIdx)}
                  className="mt-2 text-xs flex items-center gap-1"
                  style={{ color: '#22c55e' }}>
                  <Plus size={12} /> Agregar ejercicio
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

export default function RutinasEntrenador() {
  const [rutinas, setRutinas] = useState([])
  const [clientes, setClientes] = useState([])
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

  useEffect(() => {
    fetchRutinas()
    getMisClientes().then(({ data }) => setClientes(data)).catch(() => {})
  }, [])

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
          <button onClick={() => setModal({ mode: 'create' })}
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
            <button onClick={() => setModal({ mode: 'create' })} className="mt-3 text-sm" style={{ color: '#22c55e' }}>
              Crear la primera
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3" style={{ maxWidth: '960px' }}>
            {rutinas.map((rutina) => (
              <div key={rutina.id}
                style={{ border: selected === rutina.id ? '1px solid #22c55e44' : '1px solid #111', borderRadius: '8px', backgroundColor: '#000', overflow: 'hidden' }}>
                <div className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setSelected(selected === rutina.id ? null : rutina.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: '#fff' }}>{rutina.nombre}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        {rutina.objetivo}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: '#555' }}>{rutina.dias_semana} días/semana</span>
                      {rutina.usuario ? (
                        <span className="text-xs" style={{ color: '#22c55e' }}>
                          → {rutina.usuario.nombre_usuario}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: '#444' }}>Sin asignar</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md"
                      style={{ border: '1px solid #222', color: '#aaa', backgroundColor: '#0d0d0d' }}
                      onClick={e => { e.stopPropagation(); setModal({ mode: 'edit', rutina }) }}>
                      Editar
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md"
                      style={{ border: '1px solid #ef444433', color: '#ef4444', backgroundColor: '#1a0a0a' }}
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(rutina.id) }}>
                      Eliminar
                    </button>
                  </div>
                </div>

                {selected === rutina.id && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid #111' }}>
                    {rutina.ejercicios.map((dia) => (
                      <div key={dia.dia} className="mt-3">
                        <p className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>{dia.nombre}</p>
                        {dia.ejercicios.length === 0 ? (
                          <p className="text-xs" style={{ color: '#444' }}>Sin ejercicios</p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {dia.ejercicios.map((ej, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-sm" style={{ color: '#ccc' }}>{ej.nombre}</span>
                                {(ej.series || ej.reps) && (
                                  <span className="text-xs" style={{ color: '#555' }}>
                                    {ej.series && `${ej.series} series`}{ej.reps && ` × ${ej.reps} reps`}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <RutinaModal
          initial={modal.mode === 'edit' ? modal.rutina : undefined}
          onClose={() => setModal(null)}
          onSave={modal.mode === 'create' ? handleCreate : handleUpdate}
          clientes={clientes}
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
