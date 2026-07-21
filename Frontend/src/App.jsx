import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import RegisterProfesional from './pages/RegisterProfesional'
import AppLayout from './components/AppLayout'
import Ejercicios from './pages/Ejercicios'
import Rutinas from './pages/Rutinas'
import CrearRutina from './pages/CrearRutina'
import Progreso from './pages/Progreso'
import MisAlumnos from './pages/entrenador/MisAlumnos'
import RutinasEntrenador from './pages/entrenador/RutinasEntrenador'
import SolicitudesEntrenador from './pages/entrenador/SolicitudesEntrenador'
import MisPacientes from './pages/nutricionista/MisPacientes'
import PlanesAlimenticios from './pages/nutricionista/PlanesAlimenticios'
import SolicitudesNutricionista from './pages/nutricionista/SolicitudesNutricionista'
import Alimentacion from './pages/Alimentacion'
import Chat from './pages/Chat'
import Comunidades from './pages/Comunidades'
import MiEntrenador from './pages/MiEntrenador'
import MiNutricionista from './pages/MiNutricionista'

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
      <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/rutinas" element={<PrivateRoute><Rutinas /></PrivateRoute>} />
          <Route path="/crear-rutina" element={<PrivateRoute><CrearRutina /></PrivateRoute>} />
          <Route path="/editar-rutina/:id" element={<PrivateRoute><CrearRutina /></PrivateRoute>} />
          <Route path="/ejercicios" element={<PrivateRoute><Ejercicios /></PrivateRoute>} />
          <Route path="/progreso" element={<PrivateRoute><Progreso /></PrivateRoute>} />
          <Route path="/comunidad" element={<PrivateRoute><Comunidades /></PrivateRoute>} />
          <Route path="/comunidades" element={<PrivateRoute><Comunidades /></PrivateRoute>} />
          <Route path="/mensajes" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/mensajes/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/chat/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/mi-entrenador" element={<PrivateRoute><MiEntrenador /></PrivateRoute>} />
          <Route path="/mi-nutricionista" element={<PrivateRoute><MiNutricionista /></PrivateRoute>} />
          <Route path="/alimentacion" element={<PrivateRoute><Alimentacion /></PrivateRoute>} />
          <Route path="/entrenador/alumnos" element={<PrivateRoute><MisAlumnos /></PrivateRoute>} />
          <Route path="/entrenador/rutinas" element={<PrivateRoute><RutinasEntrenador /></PrivateRoute>} />
          <Route path="/entrenador/solicitudes" element={<PrivateRoute><SolicitudesEntrenador /></PrivateRoute>} />
          <Route path="/entrenador/mensajes" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/entrenador/mensajes/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/nutricionista/pacientes" element={<PrivateRoute><MisPacientes /></PrivateRoute>} />
          <Route path="/nutricionista/planes" element={<PrivateRoute><PlanesAlimenticios /></PrivateRoute>} />
          <Route path="/nutricionista/solicitudes" element={<PrivateRoute><SolicitudesNutricionista /></PrivateRoute>} />
          <Route path="/nutricionista/mensajes" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/nutricionista/mensajes/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/register-profesional" element={<RegisterProfesional />} />
          <Route path="/comunidades/:id" element={<PrivateRoute><Comunidades /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}
