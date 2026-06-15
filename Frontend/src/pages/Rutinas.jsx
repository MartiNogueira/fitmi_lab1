
import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { List, Pencil, Sparkles, Trash2, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { deleteRutina, getRutinas } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { clearSelectedRutinaId, getSelectedRutinaId } from '../utils/rutinaSelection'

const cardBase = {
  border: '1px solid #111',
  borderRadius: '8px',
  backgroundColor: '#000',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

export default function Rutinas() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    getRutinas()
      .then(({ data }) => setRutinas(data))
      .catch(() => setError('No se pudieron cargar tus rutinas'))
      .finally(() => setLoading(false))
  }, [])

  const countEjercicios = (rutina) =>
    (rutina.ejercicios || []).reduce((total, dia) => total + (dia.ejercicios?.length || 0), 0)

  const canManage = (rutina) => rutina.entrenador_id === user?.id

  const handleDelete = async (rutina) => {
    setDeletingId(rutina.id)
    setError('')

    try {
      await deleteRutina(rutina.id)
      setRutinas((prev) => prev.filter((item) => item.id !== rutina.id))
      if (getSelectedRutinaId() === rutina.id) clearSelectedRutinaId()
      setDeleteTarget(null)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'No se pudo eliminar la rutina')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '960px' }}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Rutinas</h1>
          <p className="text-sm mt-1" style={{ color: '#333' }}>
            Elegí cómo querés organizar tu entrenamiento
          </p>
        </div>

        {/* Opciones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">

          {/* Armá tu rutina */}
          <div style={cardBase}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#0a1a0a' }}
            >
              <List size={20} color="#22c55e" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-base font-semibold mb-1" style={{ color: '#fff' }}>Armá tu rutina</p>
              <p className="text-sm" style={{ color: '#555', lineHeight: '1.5' }}>
                Elegí los ejercicios de cada día y organizá tu semana a tu manera.
              </p>
            </div>
            <button
              onClick={() => navigate('/crear-rutina')}
              className="mt-auto w-full py-2 text-sm font-semibold rounded-md transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'transparent', border: '1px solid #22c55e', color: '#22c55e' }}
            >
              Crear rutina
            </button>
          </div>

          {/* Generá con IA */}
          <div style={cardBase}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#0a1a0a' }}
            >
              <Sparkles size={20} color="#22c55e" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-base font-semibold mb-1" style={{ color: '#fff' }}>Generá con IA</p>
              <p className="text-sm" style={{ color: '#555', lineHeight: '1.5' }}>
                Contanos tus objetivos y te armamos una rutina personalizada con inteligencia artificial.
              </p>
            </div>
            <button
              className="mt-auto w-full py-2 text-sm font-semibold rounded-md transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'transparent', border: '1px solid #22c55e', color: '#22c55e' }}
            >
              Generar rutina
            </button>
          </div>

          {/* Contactar entrenador */}
          <div style={cardBase}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#0a1a0a' }}
            >
              <User size={20} color="#22c55e" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-base font-semibold mb-1" style={{ color: '#fff' }}>Contactar entrenador</p>
              <p className="text-sm" style={{ color: '#555', lineHeight: '1.5' }}>
                Pedile a un profesional que te diseñe una rutina a medida según tus objetivos.
              </p>
            </div>
            <button
              onClick={() => navigate('/mi-entrenador')}
              className="mt-auto w-full py-2 text-sm font-semibold rounded-md transition-opacity hover:opacity-70"
              style={{ backgroundColor: 'transparent', border: '1px solid #22c55e', color: '#22c55e' }}
            >
              Buscar entrenador
            </button>
          </div>

        </div>

        {/* Mis rutinas */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#333' }}
          >
            Mis rutinas
          </p>

          {loading ? (
            <p className="text-sm py-8" style={{ color: '#444' }}>Cargando rutinas...</p>
          ) : error ? (
            <p className="text-sm py-8" style={{ color: '#ef4444' }}>{error}</p>
          ) : rutinas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" style={{ border: '1px solid #111', borderRadius: '8px' }}>
              <p className="text-sm" style={{ color: '#444' }}>Todavía no creaste rutinas.</p>
              <button
                onClick={() => navigate('/crear-rutina')}
                className="mt-3 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: '#22c55e' }}
              >
                Crear la primera
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rutinas.map((rutina) => (
                <div key={rutina.id} style={{ border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000', overflow: 'hidden' }}>
                  <div className="flex items-start justify-between gap-4 px-5 py-4" style={{ borderBottom: '1px solid #111' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#fff' }}>{rutina.nombre}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                        {rutina.objetivo} · {rutina.dias_semana} días · {countEjercicios(rutina)} ejercicios
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {canManage(rutina) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => navigate(`/editar-rutina/${rutina.id}`)}
                            className="flex h-8 w-8 items-center justify-center rounded-md transition-opacity hover:opacity-75"
                            style={{ border: '1px solid #222', color: '#22c55e', backgroundColor: '#0d0d0d' }}
                            aria-label="Editar rutina"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(rutina)}
                            disabled={deletingId === rutina.id}
                            className="flex h-8 w-8 items-center justify-center rounded-md transition-opacity hover:opacity-75 disabled:opacity-50"
                            style={{ border: '1px solid #3a1010', color: '#ef4444', backgroundColor: '#120707' }}
                            aria-label="Eliminar rutina"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span
                          className="rounded-full px-2 py-1 text-xs font-medium"
                          style={{ backgroundColor: '#111', color: '#666', border: '1px solid #222' }}
                        >
                          Asignada
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                    {(rutina.ejercicios || []).map((dia) => (
                      <div key={dia.dia} className="rounded-md p-3" style={{ border: '1px solid #111', backgroundColor: '#050505' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#22c55e' }}>{dia.nombre}</p>
                        {dia.ejercicios?.length ? (
                          <div className="flex flex-col gap-1.5">
                            {dia.ejercicios.map((ejercicio, index) => (
                              <div key={`${ejercicio.nombre}-${index}`} className="flex items-start justify-between gap-3">
                                <span className="text-sm" style={{ color: '#ddd' }}>{ejercicio.nombre}</span>
                                {(ejercicio.series || ejercicio.reps) && (
                                  <span className="shrink-0 text-xs" style={{ color: '#555' }}>
                                    {[ejercicio.series && `${ejercicio.series}s`, ejercicio.reps && `${ejercicio.reps}r`].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: '#444' }}>Sin ejercicios</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.78)' }}>
          <div className="w-full max-w-sm rounded-lg p-6" style={{ backgroundColor: '#0a0a0a', border: '1px solid #222' }}>
            <div className="mb-5">
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#1a0a0a', border: '1px solid #3a1010', color: '#ef4444' }}
              >
                <Trash2 size={18} />
              </div>
              <p className="text-base font-semibold" style={{ color: '#fff' }}>Eliminar rutina</p>
              <p className="mt-2 text-sm" style={{ color: '#666', lineHeight: '1.5' }}>
                Vas a borrar "{deleteTarget.nombre}". Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
                className="flex-1 rounded-md py-2 text-sm font-medium transition-opacity hover:opacity-75 disabled:opacity-50"
                style={{ border: '1px solid #222', color: '#777', backgroundColor: 'transparent' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                disabled={deletingId === deleteTarget.id}
                className="flex-1 rounded-md py-2 text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-60"
                style={{ backgroundColor: '#ef4444', color: '#fff' }}
              >
                {deletingId === deleteTarget.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
