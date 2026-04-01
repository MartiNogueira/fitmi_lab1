import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateMe, deleteMe } from '../api/auth'
import AppLayout from '../components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Profile() {
  const { user, updateCurrentUser, logout } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const payload = {}
      if (name !== user.name) payload.name = name
      if (email !== user.email) payload.email = email
      if (password) payload.password = password

      if (Object.keys(payload).length === 0) {
        setError('No hay cambios para guardar')
        return
      }

      const { data } = await updateMe(payload)
      updateCurrentUser(data.user)
      setPassword('')
      setSuccess('Perfil actualizado correctamente')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMe()
      logout()
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la cuenta')
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8">
        <Card className="w-full max-w-sm bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition text-lg leading-none">
                ←
              </button>
              <CardTitle className="text-xl font-semibold text-foreground">Editar perfil</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && <p className="text-destructive text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-foreground text-sm">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-foreground text-sm">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Dejá vacío para no cambiar"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full text-sm text-destructive hover:underline"
                >
                  Eliminar cuenta
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">¿Estás seguro? Esta acción no se puede deshacer.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-border text-foreground"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 bg-destructive text-white hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
