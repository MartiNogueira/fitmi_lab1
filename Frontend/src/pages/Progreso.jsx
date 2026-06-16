import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import {
  enviarAvanceProgresoPorEmail,
  getRutinas,
  getMiPlan,
  getCompletadosRutina,
  getCompletadasPlan,
} from '../api/auth'
import { getSelectedRutinaId, setSelectedRutinaId } from '../utils/rutinaSelection'
import { Button } from '@/components/ui/button'

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
  const [mailLoading, setMailLoading] = useState(false)
  const [mailMessage, setMailMessage] = useState('')
  const [mailError, setMailError] = useState('')

  useEffect(() => {
    Promise.all([getRutinas(), getMiPlan()])
      .then(async ([ru, pl]) => {
        const rutinas = ru.data
        const selectedId = getSelectedRutinaId()
        const rutinaData = rutinas.find((item) => item.id === selectedId) ?? rutinas[0] ?? null
        const planData = pl.data
        if (rutinaData) setSelectedRutinaId(rutinaData.id)
        setRutina(rutinaData)
        setPlan(planData)

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

  const handleEnviarAvance = async () => {
    setMailLoading(true)
    setMailMessage('')
    setMailError('')
    try {
      const { data } = await enviarAvanceProgresoPorEmail(7)
      setMailMessage(data.message || 'Avance enviado')
    } catch (err) {
      setMailError(err.response?.data?.error || 'No se pudo enviar el avance')
    } finally {
      setMailLoading(false)
    }
  }

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
          <p className="text-sm mt-1" style={{ color: '#333' }}>Tu avance de esta semana</p>
          <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={handleEnviarAvance}
              disabled={mailLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {mailLoading ? 'Enviando...' : 'Enviar avance por email'}
            </Button>
            {mailMessage && <p className="text-xs" style={{ color: '#22c55e' }}>{mailMessage}</p>}
            {mailError && <p className="text-xs text-destructive">{mailError}</p>}
          </div>
        </div>

        {loading ? (
          <p className="text-xs" style={{ color: '#444' }}>Cargando...</p>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Entrenamiento hoy */}
            <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #111' }}>
                <p className="text-sm font-semibold" style={{ color: '#fff' }}>Entrenamiento de esta semana</p>
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
                              const done = completadosDia.some((c) => c.ejercicio_nombre === ej.nombre)
                              return (
                                <div key={ej.nombre} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-3 h-3 rounded-full shrink-0"
                                      style={{ backgroundColor: done ? '#22c55e' : '#1a1a1a', border: done ? 'none' : '1px solid #333' }} />
                                    <span className="text-sm truncate" style={{ color: done ? '#22c55e' : '#888' }}>
                                      {ej.nombre}
                                    </span>
                                  </div>
                                  <span className="text-xs shrink-0 ml-2" style={{ color: '#555' }}>
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
                <p className="text-sm font-semibold" style={{ color: '#fff' }}>Alimentación de esta semana</p>
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
      </div>
    </AppLayout>
  )
}
