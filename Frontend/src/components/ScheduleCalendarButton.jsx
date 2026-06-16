import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getMiPlan, getMiRutina } from '../api/auth'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const toMondayIndex = (date) => (date.getDay() + 6) % 7

const buildMonthCells = (monthDate) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = toMondayIndex(firstDay)
  const start = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export default function ScheduleCalendarButton() {
  const [open, setOpen] = useState(false)
  const [rutina, setRutina] = useState(null)
  const [plan, setPlan] = useState(null)
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadSchedule = async () => {
    if (rutina || plan || loading) return
    setLoading(true)
    try {
      const [rutinaRes, planRes] = await Promise.all([getMiRutina(), getMiPlan()])
      setRutina(rutinaRes.data)
      setPlan(planRes.data)
    } catch {
      setRutina(null)
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOpen = () => {
    setOpen((current) => !current)
    loadSchedule()
  }

  const selectedDay = toMondayIndex(selectedDate)
  const dayNumber = selectedDay + 1
  const today = new Date()
  const monthCells = buildMonthCells(visibleMonth)
  const monthLabel = visibleMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const rutinaDay = rutina?.ejercicios?.find((day) => Number(day.dia) === dayNumber)
  const planDay = plan?.dias?.find((day) => Number(day.dia) === dayNumber)
  const isRestDay = !rutinaDay || selectedDay >= (rutina?.dias_semana ?? 0)
  const exercises = isRestDay ? [] : rutinaDay?.ejercicios || []
  const meals = planDay?.comidas || []

  const changeMonth = (amount) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggleOpen}
        className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-secondary transition text-foreground"
        title="Calendario"
      >
        <CalendarDays className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[460px] rounded-md border border-border bg-card shadow-lg overflow-hidden z-30">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Calendario</p>
              <p className="text-xs text-muted-foreground">Actividades por día</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Cargando...</p>
          ) : (
            <div className="p-4">
              <div className="mb-4 rounded-md p-3" style={{ backgroundColor: '#050505', border: '1px solid #111' }}>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-semibold text-foreground capitalize">{monthLabel}</p>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {monthCells.map((date) => {
                    const calendarDay = toMondayIndex(date)
                    const calendarDayNumber = calendarDay + 1
                    const cellRutinaDay = rutina?.ejercicios?.find((day) => Number(day.dia) === calendarDayNumber)
                    const cellPlanDay = plan?.dias?.find((day) => Number(day.dia) === calendarDayNumber)
                    const hasWorkout = Boolean(cellRutinaDay && calendarDay < (rutina?.dias_semana ?? 0))
                    const hasMeals = Boolean(cellPlanDay?.comidas?.length)
                    const isCurrentMonth = date.getMonth() === visibleMonth.getMonth()
                    const isSelected = sameDay(date, selectedDate)
                    const isToday = sameDay(date, today)

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className="aspect-square rounded-md p-1 text-left transition hover:bg-secondary"
                        style={{
                          backgroundColor: isSelected ? '#0a1a0a' : '#080808',
                          border: `1px solid ${isSelected ? '#22c55e' : isToday ? '#22c55e55' : '#141414'}`,
                          opacity: isCurrentMonth ? 1 : 0.35,
                        }}
                      >
                        <div className="flex h-full flex-col justify-between">
                          <span
                            className="text-xs font-medium"
                            style={{ color: isToday || isSelected ? '#22c55e' : '#aaa' }}
                          >
                            {date.getDate()}
                          </span>
                          <div className="flex gap-1">
                            {hasWorkout && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            {hasMeals && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#60a5fa' }} />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Entreno</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#60a5fa' }} /> Comidas</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>

                <div className="rounded-md p-3" style={{ backgroundColor: '#050505', border: '1px solid #111' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-primary">Entrenamiento</p>
                    <p className="text-xs text-muted-foreground">{exercises.length} ejercicios</p>
                  </div>
                  {isRestDay ? (
                    <p className="text-sm text-muted-foreground">Día de descanso</p>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">{rutinaDay?.nombre || 'Rutina'}</p>
                      <div className="space-y-1.5">
                        {exercises.map((exercise) => (
                          <div key={exercise.nombre} className="flex items-center justify-between gap-3">
                            <span className="text-sm text-foreground truncate">{exercise.nombre}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {exercise.series} x {exercise.reps}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-md p-3" style={{ backgroundColor: '#050505', border: '1px solid #111' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-primary">Alimentación</p>
                    <p className="text-xs text-muted-foreground">{meals.length} comidas</p>
                  </div>
                  {meals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin comidas asignadas</p>
                  ) : (
                    <div className="space-y-1.5">
                      {meals.map((meal) => (
                        <div key={meal.nombre} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-foreground truncate">{meal.nombre}</span>
                          <span className="text-xs text-muted-foreground shrink-0 capitalize">{meal.momento}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
