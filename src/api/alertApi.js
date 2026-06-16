import axiosInstance from './axios'

// GET /api/v1/alerts
export const getAllAlertsApi = (params) =>
  axiosInstance.get('/alerts', { params })

// POST /api/v1/alerts  — SuperAdmin, Admin
export const createAlertApi = (data) =>
  axiosInstance.post('/alerts', data)

// GET /api/v1/alerts/:id
export const getAlertByIdApi = (id) =>
  axiosInstance.get(`/alerts/${id}`)

// PUT /api/v1/alerts/:id  — SuperAdmin, Admin
export const updateAlertApi = (id, data) =>
  axiosInstance.put(`/alerts/${id}`, data)

// DELETE /api/v1/alerts/:id  — SuperAdmin
export const deleteAlertApi = (id) =>
  axiosInstance.delete(`/alerts/${id}`)

// PATCH /api/v1/alerts/:id/resolve  — SuperAdmin, Admin
export const resolveAlertApi = (id) =>
  axiosInstance.patch(`/alerts/${id}/resolve`)

// PATCH /api/v1/alerts/:id/snooze  — SuperAdmin, Admin, Standard
export const snoozeAlertApi = (id, data) =>
  axiosInstance.patch(`/alerts/${id}/snooze`, data)

// PATCH /api/v1/alerts/:id/dismiss  — SuperAdmin, Admin, Standard
export const dismissAlertApi = (id) =>
  axiosInstance.patch(`/alerts/${id}/dismiss`)
