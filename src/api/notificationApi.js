import axiosInstance from './axios'

// GET /api/v1/notifications  (verifyJWT)
export const getMyNotificationsApi = (params = { limit: 20 }) =>
  axiosInstance.get('/notifications', { params })

// PATCH /api/v1/notifications/mark-all-read  (verifyJWT)
export const markAllNotificationsReadApi = () =>
  axiosInstance.patch('/notifications/mark-all-read')

// PATCH /api/v1/notifications/:id/read  (verifyJWT)
export const markNotificationReadApi = (id) =>
  axiosInstance.patch(`/notifications/${id}/read`)

// PATCH /api/v1/notifications/:id/dismiss  (verifyJWT)
export const dismissNotificationApi = (id) =>
  axiosInstance.patch(`/notifications/${id}/dismiss`)
