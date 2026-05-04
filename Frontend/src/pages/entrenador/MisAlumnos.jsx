import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { getMisClientes } from '../../api/auth'

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function MisAlumnos() {
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getMisClientes()
      .then(({ data }) => setAlumnos(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = alumnos.filter(a =>
    a.nombre_usuario.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000' }}>
        <div className="mb-6 flex items-center justify-between" style={{ maxWidth: '960px' }}>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>Mis alumnos</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>
              {loading ? '...' : `${alumnos.length} alumno${alumnos.length !== 1 ? 's' : ''} vinculado${alumnos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="mb-4" style={{ maxWidth: '960px' }}>
          <input
            type="text" placeholder="Buscar alumno..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-md outline-none"
            style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', color: '#fff' }}
          />
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: '#444' }}>Cargando...</p>
        ) : (
          <div className="flex flex-col gap-3" style={{ maxWidth: '960px' }}>
            {filtered.map((alumno) => (
              <div key={alumno.id_usuario} className="flex items-center gap-4 p-4 rounded-lg"
                style={{ border: '1px solid #111', backgroundColor: '#000' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                  {initials(alumno.nombre_usuario)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#fff' }}>{alumno.nombre_usuario}</p>
                  <p className="text-xs" style={{ color: '#555' }}>{alumno.email}</p>
                </div>
                <button
                  onClick={() => navigate(`/chat/${alumno.id_usuario}`, { state: { nombre: alumno.nombre_usuario } })}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#111', border: '1px solid #222' }}
                  title="Enviar mensaje">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="text-center py-16">
                <p className="text-sm" style={{ color: '#444' }}>
                  {alumnos.length === 0 ? 'Todavía no tenés alumnos vinculados' : 'No se encontraron alumnos'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
