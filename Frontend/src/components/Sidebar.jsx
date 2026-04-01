import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutGrid, List, Dumbbell, BarChart2, Users, Monitor, User } from 'lucide-react'

const nav = [
  {
    section: 'PRINCIPAL',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
      { label: 'Rutinas', path: '/rutinas', icon: List },
      { label: 'Ejercicios', path: '/ejercicios', icon: Dumbbell },
      { label: 'Progreso', path: '/progreso', icon: BarChart2 },
    ],
  },
  {
    section: 'SOCIAL',
    items: [
      { label: 'Comunidad', path: '/comunidad', icon: Users },
      { label: 'Mensajes', path: '/mensajes', icon: Monitor },
    ],
  },
  {
    section: 'PROFESIONAL',
    items: [
      { label: 'Mi entrenador', path: '/mi-entrenador', icon: User },
    ],
  },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col bg-background border-r border-border z-20 px-4 py-6">
      <div className="mb-8 px-2">
        <span className="text-2xl font-bold tracking-tight text-foreground">
          Fitm<span className="text-primary">i</span>
        </span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {nav.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase mb-1.5 px-2">
              {section}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ label, path, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`
                    }
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={() => { logout(); navigate('/login') }}
        className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition text-left"
      >
        Cerrar sesión
      </button>
    </aside>
  )
}
