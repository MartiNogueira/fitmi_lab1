import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import AppLayout from './AppLayout'
import { getInterlocutores, getConversacion, enviarMensaje } from '../api/auth'

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function MessageStatus({ message }) {
  return (
    <span
      className="font-bold leading-none"
      title={message.leido ? 'Leído' : 'Entregado'}
      style={{
        color: message.leido ? '#2563eb' : '#00000080',
        fontSize: '14px',
        letterSpacing: 0,
        marginLeft: '2px',
      }}
    >
      ✓✓
    </span>
  )
}

export default function InboxChat() {
  const { user } = useAuth()
  const socket = useSocket()
  const [interlocutores, setInterlocutores] = useState([])
  const [activeUser, setActiveUser] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    getInterlocutores()
      .then(({ data }) => setInterlocutores(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cargarMensajes = useCallback(async (userId) => {
    try {
      const { data } = await getConversacion(userId)
      setMensajes(data)
    } catch {}
  }, [])

  useEffect(() => {
    if (!activeUser) return
    cargarMensajes(activeUser.id_usuario)
  }, [activeUser, cargarMensajes])

  useEffect(() => {
    if (!socket) return

    const handleNuevoMensaje = (mensaje) => {
      const otherId = mensaje.remitente_id === user?.id ? mensaje.destinatario_id : mensaje.remitente_id

      setInterlocutores((prev) => {
        const current = prev.find((u) => u.id_usuario === otherId)
        if (!current) return prev
        return [current, ...prev.filter((u) => u.id_usuario !== otherId)]
      })

      if (activeUser?.id_usuario !== otherId) return

      setMensajes((prev) => {
        if (prev.some((m) => m.id === mensaje.id)) return prev
        return [...prev, mensaje]
      })

      if (mensaje.remitente_id === otherId) {
        socket.emit('mark_read', { fromUserId: otherId })
      }
    }

    socket.on('nuevo_mensaje', handleNuevoMensaje)
    return () => socket.off('nuevo_mensaje', handleNuevoMensaje)
  }, [socket, user?.id, activeUser?.id_usuario])

  useEffect(() => {
    if (!socket) return

    const handleMensajesLeidos = ({ readerId, messageIds = [] }) => {
      if (Number(readerId) !== Number(activeUser?.id_usuario)) return
      setMensajes((prev) =>
        prev.map((mensaje) =>
          messageIds.includes(mensaje.id) ? { ...mensaje, leido: true } : mensaje
        )
      )
    }

    socket.on('mensajes_leidos', handleMensajesLeidos)
    return () => socket.off('mensajes_leidos', handleMensajesLeidos)
  }, [socket, activeUser?.id_usuario])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleSend = async () => {
    if (!input.trim() || !activeUser || sending) return
    setSending(true)
    try {
      await enviarMensaje(activeUser.id_usuario, input.trim())
      setInput('')
      await cargarMensajes(activeUser.id_usuario)
    } catch {}
    setSending(false)
  }

  return (
    <AppLayout>
      <div className="flex h-screen pt-16" style={{ backgroundColor: '#000' }}>

        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col" style={{ borderRight: '1px solid #111' }}>
          <div className="px-4 py-4" style={{ borderBottom: '1px solid #111' }}>
            <h1 className="text-base font-semibold" style={{ color: '#fff' }}>Mensajes</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-xs px-4 py-3" style={{ color: '#444' }}>Cargando...</p>
            ) : interlocutores.length === 0 ? (
              <p className="text-xs px-4 py-6 text-center" style={{ color: '#444' }}>Sin conversaciones todavía</p>
            ) : interlocutores.map((u) => {
              const isActive = activeUser?.id_usuario === u.id_usuario
              return (
                <div key={u.id_usuario}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  style={{ backgroundColor: isActive ? '#0a1a0a' : 'transparent', borderBottom: '1px solid #0d0d0d' }}
                  onClick={() => setActiveUser(u)}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                    {initials(u.nombre_usuario)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: isActive ? '#22c55e' : '#fff' }}>
                      {u.nombre_usuario}
                    </span>
                    <p className="text-xs truncate" style={{ color: '#555' }}>{u.email}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
          {!activeUser ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: '#444' }}>Seleccioná una conversación</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #111' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                  {initials(activeUser.nombre_usuario)}
                </div>
                <span className="text-sm font-medium" style={{ color: '#fff' }}>{activeUser.nombre_usuario}</span>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                {mensajes.length === 0 && (
                  <p className="text-xs text-center py-8" style={{ color: '#444' }}>
                    No hay mensajes todavía. ¡Empezá la conversación!
                  </p>
                )}
                {mensajes.map((msg) => {
                  const isMine = msg.remitente_id === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-xs px-4 py-2 rounded-2xl text-sm"
                        style={isMine
                          ? { backgroundColor: '#22c55e', color: '#000' }
                          : { backgroundColor: '#111', color: '#fff', border: '1px solid #1a1a1a' }}>
                        <p>{msg.contenido}</p>
                        <div className="flex items-center justify-end mt-1">
                          <span className="text-xs">
                            {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && <MessageStatus message={msg} />}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div className="px-6 py-4" style={{ borderTop: '1px solid #111' }}>
                <div className="flex gap-3">
                  <input type="text" placeholder="Escribí un mensaje..." value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 px-4 py-2 text-sm rounded-md outline-none"
                    style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', color: '#fff' }} />
                  <button onClick={handleSend} disabled={sending}
                    className="px-4 py-2 text-sm font-semibold rounded-md"
                    style={{ backgroundColor: '#22c55e', color: '#000', opacity: sending ? 0.6 : 1 }}>
                    Enviar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </AppLayout>
  )
}
