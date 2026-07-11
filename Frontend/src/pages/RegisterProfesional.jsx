import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage, registerProfesional } from '../api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterProfesional() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [especialidad, setEspecialidad] = useState('entrenador')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerProfesional(name, email, password, especialidad)
      setSuccess(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al registrarse'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <img src="/favicon.svg" alt="Fitmi" className="h-10 w-10 mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">¡Solicitud enviada!</h1>
          <p className="text-sm text-muted-foreground">
            Tu solicitud como <span className="text-foreground font-medium">{especialidad}</span> fue recibida.
            Un administrador la revisará y recibirás acceso una vez aprobada.
          </p>
          <Link to="/login" className="block text-sm text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Link to="/" className="absolute top-5 left-5 text-muted-foreground hover:text-foreground transition-colors">
        ← Volver
      </Link>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 space-y-1">
          <img src="/favicon.svg" alt="Fitmi" className="h-10 w-10 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-foreground">Registro profesional</h1>
          <p className="text-muted-foreground text-sm">Completá tus datos para solicitar acceso</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Especialidad</Label>
            <div className="grid grid-cols-2 gap-2">
              {['entrenador', 'nutricionista'].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setEspecialidad(op)}
                  className={`py-2 rounded-md border text-sm font-medium transition capitalize ${
                    especialidad === op
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {op === 'entrenador' ? '💪 Entrenador' : '🥗 Nutricionista'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-foreground text-sm">Nombre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
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
            {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
