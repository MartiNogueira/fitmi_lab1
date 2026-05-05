import { useState, useEffect } from 'react'
import AppLayout from '../../components/AppLayout'
import { getSolicitudesVinculo, responderSolicitud } from '../../api/auth'

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function SolicitudesEntrenador() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [respondiendo, setRespondiendo] = useState(null)

  useEffect(() => {
    getSolicitudesVinculo()
      .then(({ data }) => setSolicitudes(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleResponder = async (id, accion) => {
    setRespondiendo(id)
    try {
      await responderSolicitud(id, accion)
      setSolicitudes(prev => prev.filter(s => s.id !== id))
      setExpanded(null)
    } catch {}
    setRespondiendo(null)
  }

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6" style={{ maxWidth: '720px' }}>
          <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Solicitudes</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            {loading ? '...' : `${solicitudes.length} solicitud${solicitudes.length !== 1 ? 'es' : ''} pendiente${solicitudes.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: '#444' }}>Cargando...</p>
        ) : (
          <div className="flex flex-col gap-3" style={{ maxWidth: '720px' }}>
            {solicitudes.map((s) => (
              <div key={s.id} style={{ border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000', overflow: 'hidden' }}>
                <div className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                    {initials(s.usuario.nombre_usuario)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: '#fff' }}>{s.usuario.nombre_usuario}</span>
                    <p className="text-xs" style={{ color: '#555' }}>{s.usuario.email}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#444' }}>
                    {new Date(s.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>

                {expanded === s.id && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid #111' }}>
                    <div className="flex gap-2 mt-4">
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
                )}
              </div>
            ))}

            {solicitudes.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm" style={{ color: '#444' }}>No hay solicitudes pendientes</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
