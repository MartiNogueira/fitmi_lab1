import { NavLink } from 'react-router-dom'
import { LayoutGrid, List, UtensilsCrossed, BarChart2, MessageCircle } from 'lucide-react'

const tabs = [
  { label: 'Inicio', path: '/dashboard', icon: LayoutGrid },
  { label: 'Rutinas', path: '/rutinas', icon: List },
  { label: 'Meal Plan', path: '/meal-plan', icon: UtensilsCrossed },
  { label: 'Progreso', path: '/progreso', icon: BarChart2 },
  { label: 'Mensajes', path: '/mensajes', icon: MessageCircle },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
