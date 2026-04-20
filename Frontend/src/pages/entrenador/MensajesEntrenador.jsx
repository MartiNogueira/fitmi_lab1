import { useState } from 'react'
import AppLayout from '../../components/AppLayout'

const conversations = [
  { id: 1, initials: 'JR', name: 'Juan Rodriguez', lastMessage: 'Profe, ¿mañana hacemos piernas igual?', time: 'hace 10 min', unread: 2,
    messages: [
      { from: 'alumno', text: 'Hola profe! Terminé la rutina de hoy completa', time: '10:10' },
      { from: 'entrenador', text: 'Muy bien! Seguí así', time: '10:12' },
      { from: 'alumno', text: 'Profe, ¿mañana hacemos piernas igual?', time: '10:20' },
    ]},
  { id: 2, initials: 'LP', name: 'Laura Perez', lastMessage: 'Gracias por el plan nuevo!', time: 'hace 1 hora', unread: 0,
    messages: [
      { from: 'entrenador', text: 'Laura, te envié el plan actualizado', time: '09:00' },
      { from: 'alumno', text: 'Gracias por el plan nuevo!', time: '09:15' },
    ]},
  { id: 3, initials: 'CM', name: 'Carlos Méndez', lastMessage: 'No pude ir hoy, me disculpo', time: 'ayer', unread: 1,
    messages: [{ from: 'alumno', text: 'No pude ir hoy, me disculpo', time: 'ayer 18:00' }]},
]

export default function MensajesEntrenador() {
  const [activeId, setActiveId] = useState(conversations[0].id)
  const [input, setInput] = useState('')
  const [allConvs, setAllConvs] = useState(conversations)

  const active = allConvs.find((c) => c.id === activeId)

  const send = () => {
    if (!input.trim()) return
    setAllConvs((prev) => prev.map((c) => c.id === activeId
      ? { ...c, messages: [...c.messages, { from: 'entrenador', text: input.trim(), time: 'ahora' }], lastMessage: input.trim(), time: 'ahora', unread: 0 }
      : c))
    setInput('')
  }

  return (
    <AppLayout>
      <div className="flex h-screen pt-16" style={{ backgroundColor: '#000' }}>
        <div className="w-72 shrink-0 flex flex-col" style={{ borderRight: '1px solid #111' }}>
          <div className="px-4 py-4" style={{ borderBottom: '1px solid #111' }}>
            <h1 className="text-base font-semibold" style={{ color: '#fff' }}>Mensajes</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {allConvs.map((conv) => (
              <div key={conv.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                style={{ backgroundColor: activeId === conv.id ? '#0a1a0a' : 'transparent', borderBottom: '1px solid #0d0d0d' }}
                onClick={() => { setActiveId(conv.id); setAllConvs((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread: 0 } : c)) }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
                  {conv.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: activeId === conv.id ? '#22c55e' : '#fff' }}>{conv.name}</span>
                    <span className="text-xs" style={{ color: '#444' }}>{conv.time}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: '#666' }}>{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: '#22c55e', color: '#000' }}>
                    {conv.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #111' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e44' }}>
              {active?.initials}
            </div>
            <span className="text-sm font-medium" style={{ color: '#fff' }}>{active?.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
            {active?.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'entrenador' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-xs px-4 py-2 rounded-2xl text-sm"
                  style={msg.from === 'entrenador'
                    ? { backgroundColor: '#22c55e', color: '#000' }
                    : { backgroundColor: '#111', color: '#fff', border: '1px solid #1a1a1a' }}>
                  <p>{msg.text}</p>
                  <p className="text-xs mt-1 opacity-60">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4" style={{ borderTop: '1px solid #111' }}>
            <div className="flex gap-3">
              <input type="text" placeholder="Escribí un mensaje..." value={input}
                onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                className="flex-1 px-4 py-2 text-sm rounded-md outline-none"
                style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', color: '#fff' }} />
              <button onClick={send} className="px-4 py-2 text-sm font-semibold rounded-md"
                style={{ backgroundColor: '#22c55e', color: '#000' }}>
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
