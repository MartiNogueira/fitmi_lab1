import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'
import WelcomePopup from '../components/WelcomePopup'
import DashboardEntrenador from './entrenador/DashboardEntrenador'
import DashboardNutricionista from './nutricionista/DashboardNutricionista'
import {
  getMiRutina, getMiPlan, getMensajesNoLeidos, getMiVinculo,
  getResumenProgreso, getCompletadosRutina, getCompletadasPlan, toggleEjercicio,
} from '../api/auth'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getWeekday() {
  return (new Date().getDay() + 6) % 7
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function PieProgress({ label, pct, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-14 w-14 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `conic-gradient(${color} ${pct}%, #181818 0)` }}
      >
        <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
          <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: '#fff' }}>{label}</p>
        <p className="text-[10px]" style={{ color: '#555' }}>{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [rutina, setRutina] = useState(null)
  const [plan, setPlan] = useState(null)
  const [mensajesCount, setMensajesCount] = useState(0)
  const [entrenador, setEntrenador] = useState(null)
  const [nutricionista, setNutricionista] = useState(null)
  const [resumen, setResumen] = useState({
    racha: 0,
    semana: Array(7).fill(false),
    semanal: {
      rutina: { completados: 0, total: 0, porcentaje: 0 },
      dieta: { completados: 0, total: 0, porcentaje: 0 },
    },
  })
  const [completadosHoy, setCompletadosHoy] = useState([])
  const [completadasHoy, setCompletadasHoy] = useState([])
  const [loading, setLoading] = useState(true)

  const weekday = getWeekday()

  useEffect(() => {
    if (user?.rol && user.rol !== 'cliente') return
    Promise.all([
      getMiRutina(),
      getMiPlan(),
      getMensajesNoLeidos(),
      getMiVinculo('entrenador'),
      getMiVinculo('nutricionista'),
      getResumenProgreso(),
    ]).then(async ([ru, pl, ms, en, nu, res]) => {
      const ruData = ru.data
      setRutina(ruData)
      setPlan(pl.data)
      setMensajesCount(ms.data.count)
      setEntrenador(en.data?.profesional ?? null)
      setNutricionista(nu.data?.profesional ?? null)
      setResumen(res.data)

      if (ruData) {
        const comp = await getCompletadosRutina(ruData.id)
        setCompletadosHoy(comp.data.map(c => c.ejercicio_nombre))
      }
      if (pl.data?.id) {
        const compl = await getCompletadasPlan(pl.data.id)
        setCompletadasHoy(compl.data.map(c => c.comida_nombre))
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  const handleToggleEjercicio = async (nombre) => {
    if (!rutina || !diaRutina) return
    try {
      const { data } = await toggleEjercicio({
        rutina_id: rutina.id,
        dia_numero: weekday + 1,
        ejercicio_nombre: nombre,
      })
      setCompletadosHoy(prev =>
        data.completado ? [...prev, nombre] : prev.filter(n => n !== nombre)
      )
      setResumen(prev => {
        const semana = [...prev.semana]
        if (data.completado) semana[weekday] = true
        const rutina = prev.semanal?.rutina ?? { completados: 0, total: 0, porcentaje: 0 }
        const completados = Math.max(0, rutina.completados + (data.completado ? 1 : -1))
        return {
          ...prev,
          semana,
          semanal: {
            ...prev.semanal,
            rutina: {
              ...rutina,
              completados,
              porcentaje: rutina.total > 0 ? Math.min(100, Math.round((completados / rutina.total) * 100)) : 0,
            },
          },
        }
      })
    } catch (err) {
      console.error('Error al actualizar ejercicio:', err)
    }
  }

  if (user?.rol === 'entrenador') return <DashboardEntrenador />
  if (user?.rol === 'nutricionista') return <DashboardNutricionista />

  const diaRutina = rutina?.ejercicios?.[weekday] ?? null
  const diaPlan = plan?.dias?.[weekday] ?? null
  const esDescanso = !diaRutina || weekday >= (rutina?.dias_semana ?? 0)
  const ejerciciosHoy = diaRutina?.ejercicios ?? []
  const comidasHoy = diaPlan?.comidas ?? []
  const completadosCount = ejerciciosHoy.filter(e => completadosHoy.includes(e.nombre)).length
  const comidasCompletadasCount = comidasHoy.filter(c => completadasHoy.includes(c.nombre)).length
  const pctEjerciciosHoy = ejerciciosHoy.length > 0 ? Math.round((completadosCount / ejerciciosHoy.length) * 100) : 0
  const pctComidasHoy = comidasHoy.length > 0 ? Math.round((comidasCompletadasCount / comidasHoy.length) * 100) : 0
  const pctGeneral = Math.round(
    [pctEjerciciosHoy, pctComidasHoy].filter((pct, index) =>
      index === 0 ? ejerciciosHoy.length > 0 : comidasHoy.length > 0
    ).reduce((sum, pct) => sum + pct, 0) /
    Math.max(1, [ejerciciosHoy.length > 0, comidasHoy.length > 0].filter(Boolean).length)
  )

  return (
    <AppLayout>
      <WelcomePopup userName={user?.name} userId={user?.id} />
      <div className="min-h-screen px-4 pt-16 pb-24" style={{ backgroundColor: '#000' }}>

        {/* Header */}
        <div className="mb-5 pt-2">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>
            Hola, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: '#555' }}>
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* HOY TOCA */}
        <div className="mb-4 rounded-2xl p-5"
          style={{
            backgroundColor: esDescanso ? '#0a0a0a' : '#0a1a0a',
            border: `1px solid ${esDescanso ? '#1a1a1a' : '#22c55e44'}`,
          }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#22c55e' }}>
                Hoy toca
              </p>
              {loading ? (
                <p className="text-lg font-bold" style={{ color: '#fff' }}>Cargando...</p>
              ) : esDescanso ? (
                <p className="text-lg font-bold" style={{ color: '#fff' }}>Día de descanso</p>
              ) : (
                <p className="text-lg font-bold" style={{ color: '#fff' }}>{diaRutina.nombre}</p>
              )}
            </div>
            {!esDescanso && !loading && ejerciciosHoy.length > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                  {completadosCount}/{ejerciciosHoy.length}
                </p>
                <p className="text-xs" style={{ color: '#555' }}>completados</p>
              </div>
            )}
          </div>

          {!esDescanso && !loading && ejerciciosHoy.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {ejerciciosHoy.map((ej) => {
                const done = completadosHoy.includes(ej.nombre)
                return (
                  <button
                    key={ej.nombre}
                    onClick={() => handleToggleEjercicio(ej.nombre)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl w-full text-left"
                    style={{
                      backgroundColor: done ? '#0f2a0f' : '#0d0d0d',
                      border: `1px solid ${done ? '#22c55e44' : '#1a1a1a'}`,
                    }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: done ? '#22c55e' : 'transparent',
                        border: `2px solid ${done ? '#22c55e' : '#333'}`,
                      }}>
                      {done && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm flex-1"
                      style={{ color: done ? '#22c55e' : '#ccc', textDecoration: done ? 'line-through' : 'none' }}>
                      {ej.nombre}
                    </span>
                    <span className="text-xs" style={{ color: '#444' }}>{ej.series}×{ej.reps}</span>
                  </button>
                )
              })}
            </div>
          )}

          {!loading && (
            <button
              onClick={() => navigate('/ejercicios')}
              className="w-full py-2.5 text-sm font-semibold rounded-xl"
              style={{
                backgroundColor: esDescanso ? '#0d0d0d' : '#22c55e',
                color: esDescanso ? '#555' : '#000',
                border: esDescanso ? '1px solid #1a1a1a' : 'none',
              }}>
              {esDescanso ? 'Ver rutina' : 'Ver rutina completa'}
            </button>
          )}
        </div>

        {/* Gráfico de progreso */}
        <div className="mb-4 rounded-2xl p-5" style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' }}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#22c55e' }}>
                Progreso
              </p>
              <p className="text-sm font-semibold" style={{ color: '#fff' }}>Avance de hoy</p>
            </div>
            <div className="flex flex-wrap justify-end gap-4">
              <PieProgress
                label="Rutina semanal"
                pct={resumen.semanal?.rutina?.porcentaje ?? 0}
                value={`${resumen.semanal?.rutina?.completados ?? 0}/${resumen.semanal?.rutina?.total ?? 0}`}
                color="#22c55e"
              />
              <PieProgress
                label="Dieta semanal"
                pct={resumen.semanal?.dieta?.porcentaje ?? 0}
                value={`${resumen.semanal?.dieta?.completados ?? 0}/${resumen.semanal?.dieta?.total ?? 0}`}
                color="#60a5fa"
              />
              <div className="text-right">
                <p className="text-3xl font-bold" style={{ color: '#22c55e' }}>{pctGeneral}%</p>
                <p className="text-xs" style={{ color: '#555' }}>hoy</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Entrenamiento', pct: pctEjerciciosHoy, value: `${completadosCount}/${ejerciciosHoy.length}` },
              { label: 'Alimentación', pct: pctComidasHoy, value: `${comidasCompletadasCount}/${comidasHoy.length}` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3" style={{ backgroundColor: '#050505', border: '1px solid #111' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium" style={{ color: '#aaa' }}>{item.label}</p>
                  <p className="text-xs font-bold" style={{ color: '#22c55e' }}>{item.value}</p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#141414' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.pct}%`, backgroundColor: '#22c55e', transition: 'width 0.3s' }}
                  />
                </div>
                <p className="text-lg font-bold mt-2" style={{ color: '#fff' }}>{item.pct}%</p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-end justify-between gap-2" style={{ height: '88px' }}>
              {DIAS.map((dia, i) => {
                const value = resumen.semana[i] ? 100 : 12
                return (
                  <div key={dia} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div className="w-full rounded-t-md"
                      style={{
                        height: `${value}%`,
                        minHeight: '10px',
                        maxWidth: '28px',
                        backgroundColor: resumen.semana[i] ? '#22c55e' : (i === weekday ? '#163016' : '#111'),
                        border: `1px solid ${resumen.semana[i] ? '#22c55e' : '#1a1a1a'}`,
                      }}
                    />
                    <span className="text-[10px]" style={{ color: i === weekday ? '#22c55e' : '#444' }}>{dia}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Racha + Semana */}
        <div className="flex gap-3 mb-4">
          <div className="rounded-2xl p-4 flex flex-col items-center justify-center shrink-0"
            style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', minWidth: '84px' }}>
            <p className="text-2xl">🔥</p>
            <p className="text-xl font-bold mt-1" style={{ color: '#fff' }}>{resumen.racha}</p>
            <p className="text-xs text-center mt-0.5" style={{ color: '#555', lineHeight: '1.2' }}>días{'\n'}seguidos</p>
          </div>

          <div className="flex-1 rounded-2xl p-4" style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#555' }}>Esta semana</p>
            <div className="flex justify-between">
              {DIAS.map((dia, i) => (
                <div key={dia} className="flex flex-col items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: resumen.semana[i] ? '#22c55e' : (i === weekday ? '#0a1a0a' : 'transparent'),
                      border: `2px solid ${resumen.semana[i] ? '#22c55e' : (i === weekday ? '#22c55e55' : '#1a1a1a')}`,
                    }}>
                    {resumen.semana[i] && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: i === weekday ? '#22c55e' : '#333' }}>{dia}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comidas del día */}
        {!loading && plan && comidasHoy.length > 0 && (
          <div className="mb-4 rounded-2xl p-5" style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#22c55e' }}>
                  Alimentación
                </p>
                <p className="text-sm font-semibold" style={{ color: '#fff' }}>
                  {diaPlan?.nombre || 'Comidas de hoy'}
                </p>
              </div>
              <p className="text-sm font-bold" style={{ color: '#22c55e' }}>
                {plan.objetivo}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              {comidasHoy.map((c) => (
                <div key={c.nombre} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#22c55e44' }} />
                    <span className="text-sm" style={{ color: '#ccc' }}>{c.nombre}</span>
                  </div>
                  <span className="text-xs capitalize" style={{ color: '#444' }}>{c.momento}</span>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/alimentacion')}
              className="w-full py-2 text-sm rounded-xl"
              style={{ backgroundColor: '#111', color: '#666', border: '1px solid #1a1a1a' }}>
              Ver plan completo
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Progreso', sub: 'Ver historial', path: '/progreso' },
            { label: 'Ejercicios', sub: rutina?.nombre ?? 'Sin rutina', path: '/ejercicios' },
            { label: 'Alimentación', sub: plan?.nombre ?? 'Sin plan', path: '/alimentacion' },
            {
              label: 'Mensajes',
              sub: mensajesCount > 0 ? `${mensajesCount} sin leer` : 'Sin mensajes nuevos',
              badge: mensajesCount > 0,
              path: entrenador
                ? `/chat/${entrenador.id_usuario}`
                : nutricionista
                  ? `/chat/${nutricionista.id_usuario}`
                  : null,
              state: entrenador
                ? { nombre: entrenador.nombre_usuario }
                : nutricionista
                  ? { nombre: nutricionista.nombre_usuario }
                  : undefined,
            },
          ].map(({ label, sub, path, state, badge }) => (
            <button
              key={label}
              onClick={() => path && navigate(path, state ? { state } : undefined)}
              className="rounded-2xl p-4 text-left"
              style={{
                backgroundColor: '#0a0a0a',
                border: `1px solid ${badge ? '#ef444433' : '#1a1a1a'}`,
                opacity: path ? 1 : 0.4,
              }}>
              <p className="text-sm font-semibold mb-0.5" style={{ color: badge ? '#ef4444' : '#fff' }}>
                {label}{badge ? ` · ${mensajesCount}` : ''}
              </p>
              <p className="text-xs" style={{ color: '#444' }}>{sub}</p>
            </button>
          ))}
        </div>

        {/* Mi equipo */}
        {(entrenador || nutricionista) && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#555' }}>
              Mi equipo
            </p>
            <div className="flex flex-col gap-2">
              {[
                entrenador && { prof: entrenador, label: 'Entrenador' },
                nutricionista && { prof: nutricionista, label: 'Nutricionista' },
              ].filter(Boolean).map(({ prof, label }) => (
                <button
                  key={prof.id_usuario}
                  onClick={() => navigate(`/chat/${prof.id_usuario}`, { state: { nombre: prof.nombre_usuario } })}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                  style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                    {initials(prof.nombre_usuario)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: '#fff' }}>{prof.nombre_usuario}</p>
                    <p className="text-xs" style={{ color: '#555' }}>{label}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
