import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Bienvenido, {user?.name}</h1>
      <Button
        variant="outline"
        onClick={handleLogout}
        className="border-border text-foreground hover:bg-secondary mt-2"
      >
        Cerrar sesión
      </Button>
    </div>
  )
}
