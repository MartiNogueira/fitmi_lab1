import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { getProfesionales, solicitarVinculo } from '../api/auth'

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function MiEntrenador() {
  const [profesionales, setProfesionales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [solicitando, setSolicitando] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getProfesionales('entrenador')
      .then(({ data }) => setProfesionales(data))
      .catch(() => setError('No se pudieron cargar los entrenadores'))
      .finally(() => setLoading(false))
  }, [])

  const handleSolicitar = async (profesional) => {
    setSolicitando(profesional.id_usuario)
    setError('')
    try {
      await solicitarVinculo(profesional.id_usuario, 'entrenador')
      setProfesionales(prev =>
        prev.map(p => p.id_usuario === profesional.id_usuario
          ? { ...p, estado_vinculo: 'pendiente' }
          : p
        )
      )
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Error al enviar solicitud')
    } finally {
      setSolicitando(null)
    }
  }

  const yaVinculado = profesionales.some(p => p.estado_vinculo === 'activo' || p.estado_vinculo === 'pendiente')

  const filtered = profesionales.filter(p =>
    p.nombre_usuario.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '720px' }}>

        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Mi entrenador</h1>
          <p className="text-sm mt-1" style={{ color: '#333' }}>
            Encontrá un entrenador y enviá una solicitud
          </p>
        </div>

        {error && (
          <p className="text-xs mb-4 px-3 py-2 rounded-md"
            style={{ backgroundColor: '#1a0a0a', color: '#f87171', border: '1px solid #3a1010' }}>
            {error}
          </p>
        )}

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar entrenador..."
          className="w-full mb-5 text-sm outline-none"
          style={{ backgroundColor: '#0a0a0a', border: '1px solid #111', borderRadius: '8px', padding: '10px 14px', color: '#fff' }}
        />

        {loading ? (
          <p className="text-sm" style={{ color: '#444' }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: '#444' }}>No se encontraron entrenadores</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((p) => {
              const estado = p.estado_vinculo
              return (
                <div key={p.id_usuario} className="flex items-center gap-4 p-4"
                  style={{ border: estado === 'activo' ? '1px solid #22c55e44' : '1px solid #111', borderRadius: '8px', backgroundColor: '#000' }}>

                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                    {initials(p.nombre_usuario)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#fff' }}>{p.nombre_usuario}</p>
                    <p className="text-xs" style={{ color: '#555' }}>{p.email}</p>
                  </div>

                  {estado === 'activo' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-3 py-1 rounded-full"
                        style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                        Vinculado ✓
                      </span>
                      <button
                        onClick={() => navigate(`/chat/${p.id_usuario}`, { state: { nombre: p.nombre_usuario } })}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#111', border: '1px solid #222' }}
                        title="Enviar mensaje">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {estado === 'pendiente' && (
                    <span className="text-xs px-3 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: '#0d0d0d', color: '#f59e0b', border: '1px solid #f59e0b44' }}>
                      Pendiente
                    </span>
                  )}
                  {estado === 'rechazado' && (
                    <span className="text-xs px-3 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: '#1a0a0a', color: '#ef4444', border: '1px solid #ef444444' }}>
                      Rechazado
                    </span>
                  )}
                  {!estado && !yaVinculado && (
                    <button
                      onClick={() => handleSolicitar(p)}
                      disabled={solicitando === p.id_usuario}
                      className="text-xs px-3 py-1.5 rounded-md font-semibold shrink-0 transition-opacity hover:opacity-80"
                      style={{ backgroundColor: '#22c55e', color: '#000', opacity: solicitando === p.id_usuario ? 0.6 : 1 }}>
                      {solicitando === p.id_usuario ? '...' : 'Solicitar'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
