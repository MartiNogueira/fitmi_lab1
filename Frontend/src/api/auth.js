import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

export const register = (name, email, password) =>
  api.post('/auth/register', { name, email, password })

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email })

export const resetPassword = (token, password) =>
  api.post('/auth/reset-password', { token, password })
