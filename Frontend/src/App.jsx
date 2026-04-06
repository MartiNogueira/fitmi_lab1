import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import RegisterProfesional from './pages/RegisterProfesional'
import AppLayout from './components/AppLayout'
import Ejercicios from './pages/Ejercicios'
import Rutinas from './pages/Rutinas'
import Progreso from './pages/Progreso'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/" replace />
}

function ComingSoon({ title }) {
  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{title} — próximamente</p>
      </div>
    </AppLayout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/rutinas" element={<PrivateRoute><Rutinas /></PrivateRoute>} />
          <Route path="/ejercicios" element={<PrivateRoute><Ejercicios /></PrivateRoute>} />
          <Route path="/progreso" element={<PrivateRoute><Progreso /></PrivateRoute>} />
          <Route path="/comunidad" element={<PrivateRoute><ComingSoon title="Comunidad" /></PrivateRoute>} />
          <Route path="/mensajes" element={<PrivateRoute><ComingSoon title="Mensajes" /></PrivateRoute>} />
          <Route path="/mi-entrenador" element={<PrivateRoute><ComingSoon title="Mi entrenador" /></PrivateRoute>} />
          <Route path="/register-profesional" element={<RegisterProfesional />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
