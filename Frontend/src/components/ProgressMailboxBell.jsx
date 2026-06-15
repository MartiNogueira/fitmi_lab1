import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mail, Plus, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  eliminarNotificacion,
  enviarRecordatorioProgreso,
  getMisClientes,
  getNotificaciones,
  marcarLeida,
} from '../api/auth'

const formatDate = (value) =>
  new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function ProgressMailboxBell() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [clientes, setClientes] = useState([])
  const [open, setOpen] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [message, setMessage] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem('progressMailboxEnabled')
    return stored == null ? true : stored === 'true'
  })
  const ref = useRef(null)
  const isProfessional = ['entrenador', 'nutricionista'].includes(user?.rol)
  const visibleTypes = useMemo(
    () => (isProfessional ? ['reporte_avance'] : ['recordatorio_progreso']),
    [isProfessional]
  )

  const fetchItems = useCallback(async () => {
    const { data } = await getNotificaciones()
    setItems(data.filter((item) => visibleTypes.includes(item.tipo)))
  }, [visibleTypes])

  useEffect(() => {
    if (!notificationsEnabled) {
      setItems([])
      return undefined
    }
    setTimeout(() => {
      fetchItems().catch(() => {})
      if (isProfessional) {
        getMisClientes().then(({ data }) => setClientes(data)).catch(() => {})
      }
    }, 0)
    const interval = setInterval(() => fetchItems().catch(() => {}), 30000)
    return () => clearInterval(interval)
  }, [fetchItems, isProfessional, notificationsEnabled])

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = items.filter((item) => !item.leida).length

  const toggleNotifications = () => {
    setNotificationsEnabled((current) => {
      const next = !current
      localStorage.setItem('progressMailboxEnabled', String(next))
      if (!next) {
        setItems([])
        setOpenId(null)
        setShowReminderPicker(false)
        setSelectedClient(null)
        setMessage('')
      }
      return next
    })
  }

  const handleOpenItem = async (item) => {
    setOpenId((current) => (current === item.id ? null : item.id))
    if (!item.leida) {
      await marcarLeida(item.id)
      await fetchItems()
    }
  }

  const handleDelete = async (event, id) => {
    event.stopPropagation()
    await eliminarNotificacion(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAskReminder = (client) => {
    setSelectedClient(client)
    setShowReminderPicker(false)
    setMessage('')
  }

  const handleSendReminder = async () => {
    if (!selectedClient || sendingReminder) return
    setSendingReminder(true)
    setMessage('')
    try {
      const { data } = await enviarRecordatorioProgreso(selectedClient.id_usuario)
      setMessage(data.message || 'Recordatorio enviado')
      setSelectedClient(null)
    } catch (err) {
      setMessage(err.response?.data?.error || 'No se pudo enviar el recordatorio')
    } finally {
      setSendingReminder(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-secondary transition text-foreground"
        title="Avances recibidos"
      >
        <Mail className="h-5 w-5" />
        {notificationsEnabled && unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 rounded-md border border-border bg-card shadow-lg overflow-hidden z-30">
          <div className="px-4 py-2 border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                {isProfessional ? 'Avances recibidos' : 'Recordatorios'}
              </p>
              <button
                type="button"
                onClick={toggleNotifications}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                title={notificationsEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
              >
                {notificationsEnabled ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                {notificationsEnabled ? 'Activado' : 'Desactivado'}
              </button>
              {isProfessional && notificationsEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setShowReminderPicker((current) => !current)
                    setSelectedClient(null)
                    setMessage('')
                  }}
                  className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-secondary transition"
                  title="Enviar recordatorio"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {!notificationsEnabled ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              Notificaciones desactivadas
            </p>
          ) : showReminderPicker && (
            <div className="px-4 py-3 border-b border-border bg-background">
              <p className="text-xs font-medium text-foreground mb-2">Elegí un alumno</p>
              {clientes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tenés alumnos vinculados.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {clientes.map((client) => (
                    <button
                      key={client.id_usuario}
                      type="button"
                      onClick={() => handleAskReminder(client)}
                      className="rounded-md px-2 py-2 text-left text-sm text-foreground hover:bg-secondary transition"
                    >
                      {client.nombre_usuario}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {notificationsEnabled && selectedClient && (
            <div className="px-4 py-3 border-b border-border bg-background">
              <p className="text-sm text-foreground">
                ¿Desea enviarle un recordatorio a {selectedClient.nombre_usuario} para que envíe su progreso?
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
                >
                  No
                </button>
              </div>
            </div>
          )}
          {notificationsEnabled && message && (
            <p className="px-4 py-2 border-b border-border text-xs text-primary">{message}</p>
          )}
          {notificationsEnabled && items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              {isProfessional ? 'Sin avances recibidos' : 'Sin recordatorios'}
            </p>
          ) : notificationsEnabled ? (
            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {items.map((item) => {
                const data = item.data || {}
                const ejercicios = data.ejercicios || []
                const comidas = data.comidas || []
                const expanded = openId === item.id
                const avancePorcentaje = data.avance_porcentaje ?? 0
                const isReminder = item.tipo === 'recordatorio_progreso'

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleOpenItem(item)}
                    className={`w-full px-4 py-3 text-left transition hover:bg-secondary ${item.leida ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {isReminder ? data.profesional_nombre || 'Profesional' : data.usuario_nombre || 'Alumno'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isReminder
                            ? 'Recordatorio para enviar tu progreso'
                            : `${avancePorcentaje}% de avance · ${data.ejercicios_total ?? 0} ejercicios · ${data.comidas_total ?? 0} comidas`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!item.leida && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <span className="text-[10px] text-muted-foreground">{formatDate(item.created_at)}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => handleDelete(event, item.id)}
                          onKeyDown={(event) => event.key === 'Enter' && handleDelete(event, item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{item.mensaje}</p>

                    {expanded && isReminder && (
                      <div className="mt-3 rounded-md border border-border bg-background p-3">
                        <p className="text-xs text-foreground">
                          {data.profesional_nombre || 'Tu profesional'} te pidió que cargues y envíes tu progreso.
                        </p>
                      </div>
                    )}

                    {expanded && !isReminder && (
                      <div className="mt-3 space-y-3 rounded-md border border-border bg-background p-3">
                        <div>
                          <div className="flex items-end justify-between gap-3 mb-1">
                            <p className="text-xs font-semibold text-primary">Avance</p>
                            <p className="text-lg font-bold text-primary">{avancePorcentaje}%</p>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${avancePorcentaje}%` }}
                            />
                          </div>
                        </div>
                        {data.tipo_profesional === 'entrenador' && (
                          <div>
                            <p className="text-xs font-semibold text-primary mb-1">Entrenamiento</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {data.ejercicios_total ?? 0} / {data.ejercicios_objetivo ?? 0} ejercicios completados
                            </p>
                            {ejercicios.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sin ejercicios cargados en este período.</p>
                            ) : (
                              ejercicios.slice(0, 5).map((ej, index) => (
                                <p key={`${ej.nombre}-${index}`} className="text-xs text-foreground">
                                  {ej.nombre} · {ej.rutina}
                                </p>
                              ))
                            )}
                          </div>
                        )}
                        {data.tipo_profesional === 'nutricionista' && (
                          <div>
                            <p className="text-xs font-semibold text-primary mb-1">Alimentación</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {data.comidas_total ?? 0} / {data.comidas_objetivo ?? 0} comidas completadas
                            </p>
                            {comidas.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sin comidas cargadas en este período.</p>
                            ) : (
                              comidas.slice(0, 5).map((comida, index) => (
                                <p key={`${comida.nombre}-${index}`} className="text-xs text-foreground">
                                  {comida.nombre} · {comida.plan}
                                </p>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
