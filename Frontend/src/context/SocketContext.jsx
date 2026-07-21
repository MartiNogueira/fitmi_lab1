import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
      }
      return
    }

    const apiBase = import.meta.env.VITE_API_URL || '/api'
    const socketUrl = import.meta.env.VITE_SOCKET_URL
      || (apiBase.startsWith('http')
        ? apiBase.replace(/\/api\/?$/, '')
        : import.meta.env.DEV
          ? 'http://127.0.0.1:3000'
          : window.location.origin)

    const s = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = s
    setSocket(s)

    return () => {
      s.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [user])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
