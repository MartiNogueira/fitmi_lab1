import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithGoogle } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const googleScriptSrc = 'https://accounts.google.com/gsi/client'

export default function GoogleLoginButton({ onError }) {
  const [loading, setLoading] = useState(false)
  const [internalError, setInternalError] = useState('')
  const googleButtonRef = useRef(null)
  const { saveUser } = useAuth()
  const navigate = useNavigate()

  const handleError = useCallback((message) => {
    setInternalError(message)
    if (onError) {
      onError(message)
    }
  }, [onError])

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response.credential) {
      handleError('No se pudo iniciar sesión con Google')
      return
    }

    setInternalError('')
    if (onError) {
      onError('')
    }
    setLoading(true)
    try {
      const { data } = await loginWithGoogle(response.credential)
      saveUser(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      handleError(err.response?.data?.error || 'Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }, [handleError, navigate, onError, saveUser])

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      })

      googleButtonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 320,
      })
    }

    const existingScript = document.querySelector(`script[src="${googleScriptSrc}"]`)
    if (existingScript) {
      renderGoogleButton()
      return
    }

    const script = document.createElement('script')
    script.src = googleScriptSrc
    script.async = true
    script.defer = true
    script.onload = renderGoogleButton
    script.onerror = () => handleError('No se pudo cargar Google Sign-In')
    document.body.appendChild(script)
  }, [handleError, handleGoogleCredential])

  if (!googleClientId) {
    return (
      <div className="space-y-2">
        <Button type="button" variant="outline" className="w-full" disabled>
          Google no configurado
        </Button>
        <p className="text-center text-xs text-destructive">
          Falta VITE_GOOGLE_CLIENT_ID en Frontend/.env
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        ref={googleButtonRef}
        className={loading ? 'flex justify-center opacity-60 pointer-events-none' : 'flex justify-center'}
      />
      {internalError && !onError && (
        <p className="text-center text-xs text-destructive">{internalError}</p>
      )}
    </div>
  )
}
