import { useState, useEffect, useRef } from 'react'
import { getNotificaciones, marcarLeida, eliminarNotificacion, limpiarNotificaciones, aprobarProfesional, rechazarProfesional } from '../api/auth'

export default function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const fetchNotificaciones = async () => {
    try {
      const { data } = await getNotificaciones()
      setNotificaciones(data)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchNotificaciones()
    const interval = setInterval(fetchNotificaciones, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  const handleAprobar = async (notif) => {
    const profesionalId = notif.data?.profesional_id
    await aprobarProfesional(profesionalId)
    await marcarLeida(notif.id)
    fetchNotificaciones()
  }

  const handleRechazar = async (notif) => {
    const profesionalId = notif.data?.profesional_id
    await rechazarProfesional(profesionalId)
    await marcarLeida(notif.id)
    fetchNotificaciones()
  }

  const handleEliminar = async (id) => {
    await eliminarNotificacion(id)
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
  }

  const handleLimpiar = async () => {
    await limpiarNotificaciones()
    setNotificaciones([])
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-secondary transition text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border border-border bg-card shadow-lg overflow-hidden z-20">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Notificaciones</p>
            {notificaciones.length > 0 && (
              <button
                onClick={handleLimpiar}
                className="text-xs text-muted-foreground hover:text-destructive transition"
              >
                Limpiar
              </button>
            )}
          </div>
          {notificaciones.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Sin notificaciones</p>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {notificaciones.map((notif) => (
                <div key={notif.id} className={`px-4 py-3 ${notif.leida ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground">{notif.mensaje}</p>
                    <button
                      onClick={() => handleEliminar(notif.id)}
                      className="text-muted-foreground hover:text-destructive transition shrink-0 mt-0.5"
                    >
                      ✕
                    </button>
                  </div>
                  {!notif.leida && notif.tipo === 'solicitud_profesional' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAprobar(notif)}
                        className="flex-1 py-1 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRechazar(notif)}
                        className="flex-1 py-1 rounded text-xs font-medium bg-destructive text-white hover:bg-destructive/90 transition"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
