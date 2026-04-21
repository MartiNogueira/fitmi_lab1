import { useState, useMemo } from 'react'
import AppLayout from '../components/AppLayout'
import { ALL_EXERCISES, MUSCLE_GROUPS } from '../data/ejercicios'

export default function Ejercicios() {
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('Todos')

  const filtered = useMemo(() => {
    return ALL_EXERCISES.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      const matchesGroup = activeGroup === 'Todos' || ex.muscle === activeGroup
      return matchesSearch && matchesGroup
    })
  }, [search, activeGroup])

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '960px' }}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Ejercicios</h1>
          <p className="text-sm mt-1" style={{ color: '#333' }}>
            Explorá más de 1300 ejercicios con animaciones
          </p>
        </div>

        {/* Buscador */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full mb-5 outline-none text-sm"
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fff',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#22c55e44')}
          onBlur={(e) => (e.target.style.borderColor = '#111')}
        />

        {/* Filtros */}
        <div className="mb-4">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: '#333' }}
          >
            Grupo muscular
          </p>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((group) => {
              const isActive = activeGroup === group
              return (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className="text-xs px-3 py-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: isActive ? '#0a1a0a' : 'transparent',
                    border: isActive ? '1px solid #1a3a1a' : '1px solid #111',
                    color: isActive ? '#22c55e' : '#555',
                  }}
                >
                  {group}
                </button>
              )
            })}
          </div>
        </div>

        {/* Contador */}
        <p className="text-xs mb-4" style={{ color: '#444' }}>
          Mostrando {filtered.length} ejercicio{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Grilla */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((ex) => (
            <div
              key={ex.name}
              className="rounded-lg overflow-hidden cursor-pointer transition-all"
              style={{ border: '1px solid #111', backgroundColor: '#000' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1a3a1a')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#111')}
            >
              {/* GIF placeholder */}
              <div
                className="w-full flex items-center justify-center"
                style={{ aspectRatio: '1 / 1', backgroundColor: '#111' }}
              >
                <span className="text-xs" style={{ color: '#333' }}>GIF</span>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-medium mb-2" style={{ color: '#fff' }}>{ex.name}</p>
                <div className="flex gap-2 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e33' }}
                  >
                    {ex.muscle}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#0d0d0d', color: '#555', border: '1px solid #1a1a1a' }}
                  >
                    {ex.equipment}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-sm" style={{ color: '#333' }}>No se encontraron ejercicios</p>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  )
}
