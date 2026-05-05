import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import {
  getComunidades,
  createComunidad,
  updateComunidad,
  deleteComunidad,
  solicitarUnirseAComunidad,
  getSolicitudesRecibidasComunidad,
  responderSolicitudComunidad,
} from '../api/auth'
import { useAuth } from '../context/AuthContext'

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function TabButton({ active, onClick, children, badge }) {
  return (
    <button
      onClick={onClick}
      className="relative px-4 py-2 text-sm font-medium transition-colors"
      style={{ color: active ? '#22c55e' : '#666', borderBottom: active ? '2px solid #22c55e' : '2px solid transparent' }}
    >
      {children}
      {badge > 0 && (
        <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full"
          style={{ backgroundColor: '#22c55e22', color: '#22c55e' }}>
          {badge}
        </span>
      )}
    </button>
  )
}

function ComunidadCard({ c, onSolicitar, solicitando, onEditar, onEliminar, eliminando }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const estadoLabel = () => {
    if (c.es_creador) return { label: 'Tu comunidad', style: { color: '#22c55e', border: '1px solid #22c55e44', backgroundColor: '#0a1a0a' } }
    if (c.estado_solicitud === 'aceptado') return { label: 'Miembro', style: { color: '#22c55e', border: '1px solid #22c55e44', backgroundColor: '#0a1a0a' } }
    if (c.estado_solicitud === 'pendiente') return { label: 'Pendiente', style: { color: '#888', border: '1px solid #33333388', backgroundColor: '#111' } }
    if (c.estado_solicitud === 'rechazado') return { label: 'Rechazado', style: { color: '#ef4444', border: '1px solid #ef444444', backgroundColor: '#1a0a0a' } }
    return null
  }

  const badge = estadoLabel()

  return (
    <div style={{ border: '1px solid #111', borderRadius: '10px', backgroundColor: '#000', overflow: 'hidden' }}>
      <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
          {initials(c.nombre)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: '#fff' }}>{c.nombre}</span>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={badge.style}>{badge.label}</span>
            )}
            {c.privada && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#888', border: '1px solid #33333388', backgroundColor: '#111' }}>Privada</span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#555' }}>{c.descripcion}</p>
          <p className="text-xs mt-0.5" style={{ color: '#444' }}>
            {c.miembros_count} {c.miembros_count === 1 ? 'miembro' : 'miembros'} · creada por {c.creador.nombre_usuario}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid #111' }}>
          <p className="text-sm mt-3" style={{ color: '#888' }}>{c.descripcion}</p>

          {!c.es_creador && !c.estado_solicitud && (
            <button
              className="mt-3 w-full py-2 text-sm font-semibold rounded-md"
              style={{ backgroundColor: '#22c55e', color: '#000', opacity: solicitando === c.id ? 0.6 : 1 }}
              disabled={solicitando === c.id}
              onClick={(e) => { e.stopPropagation(); onSolicitar(c.id) }}>
              {solicitando === c.id ? 'Enviando...' : c.privada ? 'Solicitar unirse' : 'Unirse'}
            </button>
          )}

          {c.es_creador && (
            <div className="mt-3 flex gap-2">
              <button
                className="flex-1 py-2 text-sm font-medium rounded-md"
                style={{ backgroundColor: '#111', color: '#aaa', border: '1px solid #222' }}
                onClick={(e) => { e.stopPropagation(); onEditar(c) }}>
                Editar
              </button>
              {!confirmando ? (
                <button
                  className="flex-1 py-2 text-sm font-medium rounded-md"
                  style={{ backgroundColor: '#1a0a0a', color: '#ef4444', border: '1px solid #ef444422' }}
                  onClick={(e) => { e.stopPropagation(); setConfirmando(true) }}>
                  Eliminar
                </button>
              ) : (
                <div className="flex-1 flex gap-1">
                  <button
                    className="flex-1 py-2 text-sm font-semibold rounded-md"
                    style={{ backgroundColor: '#ef4444', color: '#fff', opacity: eliminando === c.id ? 0.6 : 1 }}
                    disabled={eliminando === c.id}
                    onClick={(e) => { e.stopPropagation(); onEliminar(c.id) }}>
                    {eliminando === c.id ? '...' : 'Confirmar'}
                  </button>
                  <button
                    className="px-3 py-2 text-sm rounded-md"
                    style={{ backgroundColor: '#111', color: '#666', border: '1px solid #222' }}
                    onClick={(e) => { e.stopPropagation(); setConfirmando(false) }}>
                    No
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ComunidadFormModal({ comunidad, onClose, onGuardar }) {
  const esEdicion = !!comunidad
  const [form, setForm] = useState(
    esEdicion
      ? { nombre: comunidad.nombre, descripcion: comunidad.descripcion, privada: comunidad.privada }
      : { nombre: '', descripcion: '', privada: false }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = esEdicion
        ? await updateComunidad(comunidad.id, form)
        : await createComunidad(form)
      onGuardar(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#00000099' }}>
      <div className="w-full max-w-md rounded-xl p-6" style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#fff' }}>
          {esEdicion ? 'Editar comunidad' : 'Nueva comunidad'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-3 py-2 rounded-md text-sm outline-none"
            style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
            required
          />
          <textarea
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
            style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff' }}
            required
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#888' }}>
            <input
              type="checkbox"
              checked={form.privada}
              onChange={(e) => setForm({ ...form, privada: e.target.checked })}
              className="accent-green-500"
            />
            Comunidad privada (requiere aprobación)
          </label>
          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-medium rounded-md"
              style={{ backgroundColor: '#111', color: '#666', border: '1px solid #222' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 text-sm font-semibold rounded-md"
              style={{ backgroundColor: '#22c55e', color: '#000', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Guardando...' : esEdicion ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Comunidades() {
  const { user } = useAuth()
  const [tab, setTab] = useState('explorar')
  const [comunidades, setComunidades] = useState([])
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalComunidad, setModalComunidad] = useState(null) // null = cerrado, false = crear, objeto = editar
  const [solicitando, setSolicitando] = useState(null)
  const [respondiendo, setRespondiendo] = useState(null)
  const [eliminando, setEliminando] = useState(null)

  const fetchData = async () => {
    try {
      const [{ data: coms }, { data: sols }] = await Promise.all([
        getComunidades(),
        getSolicitudesRecibidasComunidad(),
      ])
      setComunidades(coms)
      setSolicitudesRecibidas(sols)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSolicitar = async (id) => {
    setSolicitando(id)
    try {
      const { data } = await solicitarUnirseAComunidad(id)
      const nuevoEstado = data.estado
      setComunidades((prev) =>
        prev.map((c) => c.id === id
          ? { ...c, estado_solicitud: nuevoEstado, solicitud_id: data.id, miembros_count: nuevoEstado === 'aceptado' ? c.miembros_count + 1 : c.miembros_count }
          : c
        )
      )
    } catch {}
    setSolicitando(null)
  }

  const handleResponder = async (solicitudId, accion) => {
    setRespondiendo(solicitudId)
    try {
      await responderSolicitudComunidad(solicitudId, accion)
      setSolicitudesRecibidas((prev) => prev.filter((s) => s.id !== solicitudId))
    } catch {}
    setRespondiendo(null)
  }

  const handleGuardar = (data) => {
    if (modalComunidad) {
      // Edición: actualiza la comunidad en el array
      setComunidades((prev) => prev.map((c) => c.id === data.id ? { ...c, ...data } : c))
    } else {
      // Creación: agrega al inicio
      setComunidades((prev) => [{ ...data, miembros_count: 0, es_creador: true, estado_solicitud: null, creador: { id_usuario: user.id, nombre_usuario: user.name } }, ...prev])
    }
  }

  const handleEliminar = async (id) => {
    setEliminando(id)
    try {
      await deleteComunidad(id)
      setComunidades((prev) => prev.filter((c) => c.id !== id))
    } catch {}
    setEliminando(null)
  }

  const comunidadesFiltradas = comunidades.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  )

  const misComunidades = comunidades.filter((c) => c.es_creador || c.estado_solicitud === 'aceptado')

  const cardProps = { onSolicitar: handleSolicitar, solicitando, onEditar: (c) => setModalComunidad(c), onEliminar: handleEliminar, eliminando }

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6 flex items-start justify-between" style={{ maxWidth: '720px' }}>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Comunidades</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>
              {loading ? '...' : `${comunidades.length} comunidad${comunidades.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setModalComunidad(false)}
            className="px-4 py-2 text-sm font-semibold rounded-md"
            style={{ backgroundColor: '#22c55e', color: '#000' }}>
            + Crear
          </button>
        </div>

        <div className="flex border-b mb-4" style={{ maxWidth: '720px', borderColor: '#1a1a1a' }}>
          <TabButton active={tab === 'explorar'} onClick={() => setTab('explorar')}>Explorar</TabButton>
          <TabButton active={tab === 'mis'} onClick={() => setTab('mis')} badge={misComunidades.length}>
            Mis comunidades
          </TabButton>
          <TabButton active={tab === 'solicitudes'} onClick={() => setTab('solicitudes')} badge={solicitudesRecibidas.length}>
            Solicitudes
          </TabButton>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: '#444' }}>Cargando...</p>
        ) : (
          <div style={{ maxWidth: '720px' }}>
            {tab === 'explorar' && (
              <>
                <input
                  placeholder="Buscar comunidad..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none mb-4"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', color: '#fff' }}
                />
                <div className="flex flex-col gap-3">
                  {comunidadesFiltradas.map((c) => (
                    <ComunidadCard key={c.id} c={c} {...cardProps} />
                  ))}
                  {comunidadesFiltradas.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-sm" style={{ color: '#444' }}>No se encontraron comunidades</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === 'mis' && (
              <div className="flex flex-col gap-3">
                {misComunidades.map((c) => (
                  <ComunidadCard key={c.id} c={c} {...cardProps} />
                ))}
                {misComunidades.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-sm" style={{ color: '#444' }}>Todavía no sos parte de ninguna comunidad</p>
                    <button onClick={() => setTab('explorar')} className="mt-2 text-sm" style={{ color: '#22c55e' }}>
                      Explorar comunidades
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === 'solicitudes' && (
              <div className="flex flex-col gap-3">
                {solicitudesRecibidas.map((s) => (
                  <div key={s.id} style={{ border: '1px solid #111', borderRadius: '10px', backgroundColor: '#000', overflow: 'hidden' }}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        {initials(s.usuario.nombre_usuario)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium" style={{ color: '#fff' }}>{s.usuario.nombre_usuario}</span>
                        <p className="text-xs" style={{ color: '#555' }}>{s.usuario.email}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#444' }}>
                          quiere unirse a <span style={{ color: '#888' }}>{s.comunidad.nombre}</span>
                        </p>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: '#444' }}>
                        {new Date(s.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        className="flex-1 py-2 text-sm font-semibold rounded-md"
                        style={{ backgroundColor: '#22c55e', color: '#000', opacity: respondiendo === s.id ? 0.6 : 1 }}
                        disabled={respondiendo === s.id}
                        onClick={() => handleResponder(s.id, 'aceptar')}>
                        Aceptar
                      </button>
                      <button
                        className="flex-1 py-2 text-sm font-semibold rounded-md"
                        style={{ border: '1px solid #ef444444', color: '#ef4444', backgroundColor: '#1a0a0a', opacity: respondiendo === s.id ? 0.6 : 1 }}
                        disabled={respondiendo === s.id}
                        onClick={() => handleResponder(s.id, 'rechazar')}>
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
                {solicitudesRecibidas.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-sm" style={{ color: '#444' }}>No hay solicitudes pendientes</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {modalComunidad !== null && (
        <ComunidadFormModal
          comunidad={modalComunidad || null}
          onClose={() => setModalComunidad(null)}
          onGuardar={handleGuardar}
        />
      )}
    </AppLayout>
  )
}
