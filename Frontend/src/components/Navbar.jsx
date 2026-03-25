import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 right-0 left-0 h-14 flex items-center justify-between px-6 border-b border-border bg-card z-10">
      <span className="font-semibold text-foreground tracking-wide">Fitmi</span>
      <div className="flex items-center gap-2">
        {user?.rol === 'admin' && <NotificationBell />}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:opacity-90 transition"
        >
          {getInitials(user?.name)}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-card shadow-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { setOpen(false); navigate('/profile') }}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition"
            >
              Editar perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary transition"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
      </div>
    </nav>
  )
}
