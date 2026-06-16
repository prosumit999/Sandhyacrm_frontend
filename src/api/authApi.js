import axiosInstance from './axios'

// POST /api/v1/auth/login
export const loginApi = (credentials) =>
  axiosInstance.post('/auth/login', credentials)

// POST /api/v1/auth/logout
export const logoutApi = () =>
  axiosInstance.post('/auth/logout')

// POST /api/v1/auth/refresh
export const refreshTokenApi = () =>
  axiosInstance.post('/auth/refresh')

// POST /api/v1/auth/forgot-password
export const forgotPasswordApi = (email) =>
  axiosInstance.post('/auth/forgot-password', { email })

// POST /api/v1/auth/reset-password/:token
export const resetPasswordApi = (token, password) =>
  axiosInstance.post(`/auth/reset-password/${token}`, { password })

// POST /api/v1/auth/register  (public — creates a Standard role account)
export const registerApi = (data) =>
  axiosInstance.post('/auth/register', data)

// GET /api/v1/auth/me  (requires Authorization header)
export const getMeApi = () =>
  axiosInstance.get('/auth/me')
