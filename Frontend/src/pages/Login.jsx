import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { saveUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await login(email, password)
      saveUser(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Link to="/" className="absolute top-5 left-5 text-muted-foreground hover:text-foreground transition-colors">
        ← Volver
      </Link>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 space-y-1">
          <img src="/favicon.svg" alt="Fitmi" className="h-10 w-10 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-foreground">Iniciar sesión</h1>
          <p className="text-muted-foreground text-sm">Ingresá tu email y contraseña</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-foreground text-sm">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Registrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
