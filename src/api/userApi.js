import axiosInstance from './axios'

// GET /api/v1/users  — SuperAdmin, Admin
export const getAllUsersApi = (params) =>
  axiosInstance.get('/users', { params })

// GET /api/v1/users/:id  — SuperAdmin, Admin
export const getUserByIdApi = (id) =>
  axiosInstance.get(`/users/${id}`)

// POST /api/v1/users  — SuperAdmin
export const createUserApi = (data) =>
  axiosInstance.post('/users', data)

// PUT /api/v1/users/:id  — SuperAdmin, Admin
export const updateUserApi = (id, data) =>
  axiosInstance.put(`/users/${id}`, data)

// DELETE /api/v1/users/:id  — SuperAdmin
export const deleteUserApi = (id) =>
  axiosInstance.delete(`/users/${id}`)

// PATCH /api/v1/users/:id/toggle-active  — SuperAdmin
export const toggleUserActiveApi = (id) =>
  axiosInstance.patch(`/users/${id}/toggle-active`)

// PATCH /api/v1/users/:id/permissions  — SuperAdmin
export const updateUserPermissionsApi = (id, permissions) =>
  axiosInstance.patch(`/users/${id}/permissions`, { permissions })

// GET /api/v1/users/portfolio-stats  — SuperAdmin, Admin
export const getPortfolioStatsApi = () =>
  axiosInstance.get('/users/portfolio-stats')

// GET /api/v1/users/:id/portfolio  — SuperAdmin, Admin
export const getUserPortfolioApi = (id) =>
  axiosInstance.get(`/users/${id}/portfolio`)

// POST /api/v1/users/:id/transfer-portfolio  — SuperAdmin
export const transferPortfolioApi = (id, toUserId) =>
  axiosInstance.post(`/users/${id}/transfer-portfolio`, { toUserId })
