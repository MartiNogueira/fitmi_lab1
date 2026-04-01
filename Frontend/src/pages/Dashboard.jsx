import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'
import WelcomePopup from '../components/WelcomePopup'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <AppLayout>
      <WelcomePopup userName={user?.name} userId={user?.id} />
      <div className="min-h-screen px-8 pt-16 pb-8">
        <h1 className="text-2xl font-semibold text-foreground">Bienvenido, {user?.name}</h1>
      </div>
    </AppLayout>
  )
}
