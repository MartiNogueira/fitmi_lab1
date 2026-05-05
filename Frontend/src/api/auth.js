import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const register = (name, email, password) =>
  api.post('/auth/register', { name, email, password })

export const registerProfesional = (name, email, password, especialidad) =>
  api.post('/auth/register-profesional', { name, email, password, especialidad })

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const updateMe = (data) =>
  api.put('/auth/me', data)

export const deleteMe = () =>
  api.delete('/auth/me')

export const getNotificaciones = () =>
  api.get('/notificaciones')

export const marcarLeida = (id) =>
  api.put(`/notificaciones/${id}/leer`)

export const eliminarNotificacion = (id) =>
  api.delete(`/notificaciones/${id}`)

export const limpiarNotificaciones = () =>
  api.delete('/notificaciones')

export const aprobarProfesional = (id) =>
  api.put(`/admin/profesionales/${id}/aprobar`)

export const rechazarProfesional = (id) =>
  api.put(`/admin/profesionales/${id}/rechazar`)

export const getPlanes = () =>
  api.get('/planes')

export const createPlan = (data) =>
  api.post('/planes', data)

export const updatePlan = (id, data) =>
  api.put(`/planes/${id}`, data)

export const deletePlan = (id) =>
  api.delete(`/planes/${id}`)

export const getRutinas = () =>
  api.get('/rutinas')

export const createRutina = (data) =>
  api.post('/rutinas', data)

export const updateRutina = (id, data) =>
  api.put(`/rutinas/${id}`, data)

export const deleteRutina = (id) =>
  api.delete(`/rutinas/${id}`)

// Vínculos usuario ↔ profesional
export const getProfesionales = (tipo) =>
  api.get('/vinculos/profesionales', { params: { tipo } })

export const solicitarVinculo = (profesional_id, tipo) =>
  api.post('/vinculos/solicitar', { profesional_id, tipo })

export const getMiVinculo = (tipo) =>
  api.get('/vinculos/mi-vinculo', { params: { tipo } })

export const getSolicitudesVinculo = () =>
  api.get('/vinculos/solicitudes')

export const responderSolicitud = (id, accion) =>
  api.put(`/vinculos/${id}/responder`, { accion })

export const getMisClientes = () =>
  api.get('/vinculos/mis-clientes')

// Progreso del usuario (rutina + plan asignados)
export const getMiRutina = () =>
  api.get('/progreso/rutina')

export const getResumenProgreso = () =>
  api.get('/progreso/resumen')

export const getCompletadosRutina = (rutina_id) =>
  api.get(`/progreso/rutina/${rutina_id}/completados`)

export const toggleEjercicio = (data) =>
  api.post('/progreso/ejercicio/toggle', data)

export const getMiPlan = () =>
  api.get('/progreso/plan')

export const getCompletadasPlan = (plan_id) =>
  api.get(`/progreso/plan/${plan_id}/completadas`)

export const toggleComida = (data) =>
  api.post('/progreso/comida/toggle', data)

// Comunidades
export const getComunidades = (search) =>
  api.get('/comunidades', { params: search ? { search } : {} })

export const createComunidad = (data) =>
  api.post('/comunidades', data)

export const updateComunidad = (id, data) =>
  api.put(`/comunidades/${id}`, data)

export const deleteComunidad = (id) =>
  api.delete(`/comunidades/${id}`)

export const solicitarUnirseAComunidad = (comunidadId) =>
  api.post(`/comunidades/${comunidadId}/solicitar`)

export const getSolicitudesRecibidasComunidad = () =>
  api.get('/comunidades/solicitudes-recibidas')

export const responderSolicitudComunidad = (solicitudId, accion) =>
  api.put(`/comunidades/solicitudes/${solicitudId}/responder`, { accion })

export const getMiembrosComunidad = (comunidadId) =>
  api.get(`/comunidades/${comunidadId}/miembros`)

// Mensajes
export const getMensajesNoLeidos = () =>
  api.get('/mensajes/no-leidos')

export const getInterlocutores = () =>
  api.get('/mensajes')

export const getConversacion = (userId) =>
  api.get(`/mensajes/${userId}`)

export const enviarMensaje = (userId, contenido) =>
  api.post(`/mensajes/${userId}`, { contenido })
