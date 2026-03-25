import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col px-4">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 -mt-24">
      <div className="text-center space-y-3 flex flex-col items-center">
        <svg width="48" height="48" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#000000"/>
          <rect x="7" y="14.5" width="18" height="3" rx="1" fill="#22c55e"/>
          <rect x="5" y="10" width="4" height="12" rx="2" fill="#22c55e"/>
          <rect x="9" y="11.5" width="2.5" height="9" rx="1" fill="#16a34a"/>
          <rect x="20.5" y="11.5" width="2.5" height="9" rx="1" fill="#16a34a"/>
          <rect x="23" y="10" width="4" height="12" rx="2" fill="#22c55e"/>
        </svg>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Fitmi</h1>
        <p className="text-muted-foreground text-sm">Tu app de fitness</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={() => navigate('/login')}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          Iniciar sesión
        </Button>
        <Button
          onClick={() => navigate('/register')}
          variant="outline"
          className="w-full border-border text-foreground hover:bg-secondary"
        >
          Registrarse
        </Button>
        <div className="pt-1 border-t border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">¿Sos profesional?</p>
          <button
            onClick={() => navigate('/register-profesional')}
            className="text-sm text-primary hover:underline font-medium"
          >
            Registrate acá
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
