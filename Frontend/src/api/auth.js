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
