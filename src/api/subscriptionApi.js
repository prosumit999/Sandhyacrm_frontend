import axiosInstance from './axios'

// GET /api/v1/subscriptions
export const getAllSubscriptionsApi = (params) =>
  axiosInstance.get('/subscriptions', { params })

// POST /api/v1/subscriptions  — SuperAdmin, Admin
export const createSubscriptionApi = (data) =>
  axiosInstance.post('/subscriptions', data)

// GET /api/v1/subscriptions/:id
export const getSubscriptionByIdApi = (id) =>
  axiosInstance.get(`/subscriptions/${id}`)

// PUT /api/v1/subscriptions/:id  — SuperAdmin, Admin
export const updateSubscriptionApi = (id, data) =>
  axiosInstance.put(`/subscriptions/${id}`, data)

// DELETE /api/v1/subscriptions/:id  — SuperAdmin, Admin
export const deleteSubscriptionApi = (id) =>
  axiosInstance.delete(`/subscriptions/${id}`)

// POST /api/v1/subscriptions/:id/renew  — SuperAdmin, Admin
export const renewSubscriptionApi = (id, data) =>
  axiosInstance.post(`/subscriptions/${id}/renew`, data)
