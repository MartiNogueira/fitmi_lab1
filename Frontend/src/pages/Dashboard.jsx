import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-14 px-6">
        <h1 className="text-2xl font-semibold text-foreground pt-6">Bienvenido, {user?.name}</h1>
      </div>
    </>
  )
}
