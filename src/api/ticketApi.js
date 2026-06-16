import axiosInstance from './axios'

// GET /api/v1/tickets
export const getAllTicketsApi = (params) =>
  axiosInstance.get('/tickets', { params })

// POST /api/v1/tickets
export const createTicketApi = (data) =>
  axiosInstance.post('/tickets', data)

// GET /api/v1/tickets/:id
export const getTicketByIdApi = (id) =>
  axiosInstance.get(`/tickets/${id}`)

// PUT /api/v1/tickets/:id  — SuperAdmin, Admin
export const updateTicketApi = (id, data) =>
  axiosInstance.put(`/tickets/${id}`, data)

// DELETE /api/v1/tickets/:id  — SuperAdmin
export const deleteTicketApi = (id) =>
  axiosInstance.delete(`/tickets/${id}`)

// POST /api/v1/tickets/:id/reply
export const addTicketReplyApi = (id, data) =>
  axiosInstance.post(`/tickets/${id}/reply`, data)

// PATCH /api/v1/tickets/:id/assign  — SuperAdmin, Admin
export const assignTicketApi = (id, data) =>
  axiosInstance.patch(`/tickets/${id}/assign`, data)

// PATCH /api/v1/tickets/:id/resolve  — SuperAdmin, Admin
export const resolveTicketApi = (id) =>
  axiosInstance.patch(`/tickets/${id}/resolve`)

// PATCH /api/v1/tickets/:id/close  — SuperAdmin, Admin
export const closeTicketApi = (id) =>
  axiosInstance.patch(`/tickets/${id}/close`)

// PATCH /api/v1/tickets/:id/rate
export const rateTicketApi = (id, data) =>
  axiosInstance.patch(`/tickets/${id}/rate`, data)
