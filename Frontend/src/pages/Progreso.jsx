import { useState, useEffect, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import { getMiRutina, getMiPlan, getCompletadosRutina, getCompletadasPlan, getFotos, subirFoto, deleteFoto } from '../api/auth'

const cardStyle = { border: '1px solid #111', borderRadius: '8px', backgroundColor: '#000' }

function ProgressBar({ pct, color = '#22c55e' }) {
  return (
    <div className="w-full rounded-full" style={{ height: '4px', backgroundColor: '#111' }}>
      <div className="rounded-full" style={{ width: `${pct}%`, height: '4px', backgroundColor: color, transition: 'width 0.3s' }} />
    </div>
  )
}

export default function Progreso() {
  const [rutina, setRutina] = useState(null)
  const [plan, setPlan] = useState(null)
  const [completadosHoy, setCompletadosHoy] = useState([])
  const [completadasHoy, setCompletadasHoy] = useState([])
  const [loading, setLoading] = useState(true)

  // Fotos de progreso
  const [fotos, setFotos] = useState([])
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null)
  const [fotoDesc, setFotoDesc] = useState('')
  const [fotoFecha, setFotoFecha] = useState(new Date().toISOString().slice(0, 10))
  const [subiendo, setSubiendo] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const [fotoAmpliada, setFotoAmpliada] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    Promise.all([getMiRutina(), getMiPlan(), getFotos()])
      .then(async ([ru, pl, ft]) => {
        const rutinaData = ru.data
        const planData = pl.data
        setRutina(rutinaData)
        setPlan(planData)
        setFotos(ft.data)

        const extras = []
        if (rutinaData?.id) extras.push(getCompletadosRutina(rutinaData.id))
        else extras.push(Promise.resolve({ data: [] }))
        if (planData?.id) extras.push(getCompletadasPlan(planData.id))
        else extras.push(Promise.resolve({ data: [] }))

        const [comp, compl] = await Promise.all(extras)
        setCompletadosHoy(comp.data)
        setCompletadasHoy(compl.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubirFoto = async () => {
    if (!fotoSeleccionada) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('foto', fotoSeleccionada)
      fd.append('descripcion', fotoDesc)
      fd.append('fecha', fotoFecha)
      const { data } = await subirFoto(fd)
      setFotos(prev => [data, ...prev])
      setFotoSeleccionada(null)
      setFotoDesc('')
      setFotoFecha(new Date().toISOString().slice(0, 10))
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {}
    setSubiendo(false)
  }

  const handleEliminar = async (id) => {
    setEliminando(id)
    try {
      await deleteFoto(id)
      setFotos(prev => prev.filter(f => f.id !== id))
      if (fotoAmpliada?.id === id) setFotoAmpliada(null)
    } catch {}
    setEliminando(null)
  }

  const formatFecha = (iso) =>
    new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

  const totalEjercicios = (rutina?.ejercicios || []).reduce(
    (sum, d) => sum + (d.ejercicios?.length ?? 0), 0
  )
  const pctEjercicios = totalEjercicios > 0 ? Math.round((completadosHoy.length / totalEjercicios) * 100) : 0

  const totalComidas = (plan?.dias || []).reduce(
    (sum, d) => sum + (d.comidas?.length ?? 0), 0
  )
  const pctComidas = totalComidas > 0 ? Math.round((completadasHoy.length / totalComidas) * 100) : 0

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '960px' }}>

        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Progreso</h1>
          <p className="text-sm mt-1" style={{ color: '#333' }}>Tu avance de hoy</p>
        </div>

        {loading ? (
          <p className="text-xs" style={{ color: '#444' }}>Cargando...</p>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Entrenamiento hoy */}
            <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #111' }}>
                <p className="text-sm font-semibold" style={{ color: '#fff' }}>Entrenamiento de hoy</p>
                {rutina && <p className="text-xs mt-0.5" style={{ color: '#555' }}>{rutina.nombre}</p>}
              </div>
              <div className="px-5 py-4">
                {!rutina ? (
                  <p className="text-xs" style={{ color: '#444' }}>No tenés una rutina asignada todavía.</p>
                ) : (
                  <>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-3xl font-bold" style={{ color: '#22c55e' }}>{pctEjercicios}%</span>
                      <span className="text-xs" style={{ color: '#555' }}>
                        {completadosHoy.length} / {totalEjercicios} ejercicios
                      </span>
                    </div>
                    <ProgressBar pct={pctEjercicios} />

                    {(rutina.ejercicios || []).map((dia) => {
                      const completadosDia = completadosHoy.filter(
                        (c) => c.dia_numero === dia.dia
                      )
                      return (
                        <div key={dia.dia} className="mt-4">
                          <p className="text-xs font-medium mb-2" style={{ color: '#333' }}>{dia.nombre}</p>
                          <div className="flex flex-col gap-1.5">
                            {(dia.ejercicios || []).map((ej) => {
                              const registro = completadosDia.find((c) => c.ejercicio_nombre === ej.nombre)
                              const done = Boolean(registro)
                              return (
                                <div key={ej.nombre} className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 min-w-0">
                                    <div className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                                      style={{ backgroundColor: done ? '#22c55e' : '#1a1a1a', border: done ? 'none' : '1px solid #333' }} />
                                    <div className="min-w-0">
                                      <span className="text-sm truncate block" style={{ color: done ? '#22c55e' : '#888' }}>
                                        {ej.nombre}
                                      </span>
                                      {done && (registro?.peso_kg || registro?.reps_realizadas) && (
                                        <span className="text-xs block" style={{ color: '#22c55e77' }}>
                                          {[registro.peso_kg && `${registro.peso_kg} kg`, registro.reps_realizadas].filter(Boolean).join(' · ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs shrink-0" style={{ color: '#555' }}>
                                    {ej.series} × {ej.reps}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Alimentación hoy */}
            <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #111' }}>
                <p className="text-sm font-semibold" style={{ color: '#fff' }}>Alimentación de hoy</p>
                {plan && <p className="text-xs mt-0.5" style={{ color: '#555' }}>{plan.nombre}</p>}
              </div>
              <div className="px-5 py-4">
                {!plan ? (
                  <p className="text-xs" style={{ color: '#444' }}>No tenés un plan alimenticio asignado todavía.</p>
                ) : (
                  <>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-3xl font-bold" style={{ color: '#22c55e' }}>{pctComidas}%</span>
                      <span className="text-xs" style={{ color: '#555' }}>
                        {completadasHoy.length} / {totalComidas} comidas
                      </span>
                    </div>
                    <ProgressBar pct={pctComidas} />

                    {(plan.dias || []).map((dia) => {
                      const completadasDia = completadasHoy.filter(
                        (c) => c.dia_numero === dia.dia
                      )
                      return (
                        <div key={dia.dia} className="mt-4">
                          <p className="text-xs font-medium mb-2" style={{ color: '#333' }}>{dia.nombre}</p>
                          <div className="flex flex-col gap-1.5">
                            {(dia.comidas || []).map((c) => {
                              const done = completadasDia.some((cc) => cc.comida_nombre === c.nombre)
                              return (
                                <div key={c.nombre} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-3 h-3 rounded-full shrink-0"
                                      style={{ backgroundColor: done ? '#22c55e' : '#1a1a1a', border: done ? 'none' : '1px solid #333' }} />
                                    <span className="text-sm truncate" style={{ color: done ? '#22c55e' : '#888' }}>
                                      {c.nombre}
                                    </span>
                                  </div>
                                  <span className="text-xs shrink-0 ml-2" style={{ color: '#555' }}>{c.momento}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Fotos de progreso */}
        <div className="mt-6" style={{ ...cardStyle }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #111' }}>
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>Fotos de progreso</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: '#0a1a0a', border: '1px solid #22c55e44', color: '#22c55e' }}>
              + Subir foto
            </button>
          </div>

          {/* Formulario de subida */}
          {fotoSeleccionada && (
            <div className="px-5 py-4 flex flex-col gap-3" style={{ borderBottom: '1px solid #111' }}>
              <div className="flex items-center gap-3">
                <img
                  src={URL.createObjectURL(fotoSeleccionada)}
                  alt="preview"
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                  style={{ border: '1px solid #222' }}
                />
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={fotoDesc}
                    onChange={e => setFotoDesc(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="text-sm outline-none w-full"
                    style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '8px 12px', color: '#fff' }}
                  />
                  <input
                    type="date"
                    value={fotoFecha}
                    onChange={e => setFotoFecha(e.target.value)}
                    className="text-sm outline-none w-full"
                    style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '8px 12px', color: '#fff' }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setFotoSeleccionada(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="flex-1 py-2 rounded-lg text-xs"
                  style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', color: '#555' }}>
                  Cancelar
                </button>
                <button
                  onClick={handleSubirFoto}
                  disabled={subiendo}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: '#22c55e', color: '#000', opacity: subiendo ? 0.7 : 1 }}>
                  {subiendo ? 'Subiendo...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && setFotoSeleccionada(e.target.files[0])}
          />

          {/* Galería */}
          <div className="px-5 py-4">
            {fotos.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: '#333' }}>
                Todavía no subiste fotos. ¡Empezá a registrar tu progreso!
              </p>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {fotos.map(f => (
                  <div key={f.id} className="relative group" style={{ aspectRatio: '1' }}>
                    <img
                      src={f.url}
                      alt={f.descripcion || 'Foto de progreso'}
                      onClick={() => setFotoAmpliada(f)}
                      className="w-full h-full object-cover rounded-lg cursor-pointer"
                      style={{ border: '1px solid #1a1a1a' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 rounded-b-lg"
                      style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                      <p className="text-xs" style={{ color: '#aaa' }}>{formatFecha(f.fecha)}</p>
                    </div>
                    <button
                      onClick={() => handleEliminar(f.id)}
                      disabled={eliminando === f.id}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full items-center justify-center hidden group-hover:flex"
                      style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid #333', color: '#ef4444', fontSize: '12px' }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lightbox */}
        {fotoAmpliada && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
            onClick={() => setFotoAmpliada(null)}>
            <div className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <img src={fotoAmpliada.url} alt={fotoAmpliada.descripcion || ''} className="w-full rounded-xl object-contain" style={{ maxHeight: '70vh' }} />
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#fff' }}>{fotoAmpliada.descripcion || ''}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>{formatFecha(fotoAmpliada.fecha)}</p>
                </div>
                <button onClick={() => setFotoAmpliada(null)} style={{ color: '#555', fontSize: '20px', lineHeight: 1 }}>×</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
