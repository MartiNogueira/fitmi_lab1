import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import AppLayout from '../components/AppLayout'
import InboxChat from '../components/InboxChat'
import { getConversacion, enviarMensaje } from '../api/auth'

export default function Chat() {
  const { userId } = useParams()
  if (!userId) return <InboxChat />
  return <ChatConversation userId={userId} />
}

function ChatConversation({ userId }) {
  const { state } = useLocation()
  const { user } = useAuth()
  const socket = useSocket()
  const navigate = useNavigate()

  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef(null)

  const nombreOtro = state?.nombre ?? `Usuario ${userId}`

  // Carga inicial del historial (también marca los mensajes como leídos)
  useEffect(() => {
    setMensajes([])
    getConversacion(userId)
      .then(({ data }) => setMensajes(data))
      .catch(() => {})
  }, [userId])

  // Escucha mensajes nuevos en tiempo real
  useEffect(() => {
    if (!socket) return

    const handleNuevoMensaje = (mensaje) => {
      const otroId = Number(userId)
      const esDeMiConversacion =
        mensaje.remitente_id === otroId || mensaje.destinatario_id === otroId
      if (!esDeMiConversacion) return

      setMensajes(prev => {
        if (prev.some(m => m.id === mensaje.id)) return prev
        return [...prev, mensaje]
      })

      // Marcar como leído si el mensaje es del otro usuario
      if (mensaje.remitente_id === otroId) {
        socket.emit('mark_read', { fromUserId: otroId })
      }
    }

    socket.on('nuevo_mensaje', handleNuevoMensaje)
    return () => socket.off('nuevo_mensaje', handleNuevoMensaje)
  }, [socket, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    try {
      const { data } = await enviarMensaje(userId, texto.trim())
      setMensajes(prev => [...prev, data])
      setTexto('')
    } catch {}
    setEnviando(false)
  }

  const formatHora = (iso) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatFecha = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }

  let lastDate = null

  return (
    <AppLayout>
      <div className="flex flex-col" style={{ height: '100vh', backgroundColor: '#000' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #111', paddingTop: '72px' }}>
          <button onClick={() => navigate(-1)} className="text-sm mr-1" style={{ color: '#555' }}>←</button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
            {nombreOtro.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>{nombreOtro}</p>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
          {mensajes.length === 0 && (
            <p className="text-sm text-center mt-8" style={{ color: '#333' }}>
              No hay mensajes todavía. ¡Empezá la conversación!
            </p>
          )}

          {mensajes.map((m) => {
            const esMio = m.remitente_id === user.id
            const fechaStr = formatFecha(m.created_at)
            const showDate = fechaStr !== lastDate
            lastDate = fechaStr

            return (
              <div key={m.id}>
                {showDate && (
                  <p className="text-xs text-center my-2" style={{ color: '#333' }}>{fechaStr}</p>
                )}
                <div className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xs px-3 py-2 rounded-xl"
                    style={{
                      backgroundColor: esMio ? '#22c55e' : '#111',
                      color: esMio ? '#000' : '#fff',
                      borderRadius: esMio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    }}>
                    <p className="text-sm" style={{ wordBreak: 'break-word' }}>{m.contenido}</p>
                    <p className="text-xs mt-0.5 text-right" style={{ color: esMio ? '#00000066' : '#555' }}>
                      {formatHora(m.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleEnviar} className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid #111' }}>
          <input
            type="text"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="flex-1 text-sm outline-none"
            style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '10px 16px', color: '#fff' }}
          />
          <button
            type="submit"
            disabled={!texto.trim() || enviando}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity"
            style={{ backgroundColor: '#22c55e', opacity: !texto.trim() || enviando ? 0.4 : 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
