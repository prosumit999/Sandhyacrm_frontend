import axiosInstance from './axios'

// GET /api/v1/communications
export const getAllCommunicationsApi = (params) =>
  axiosInstance.get('/communications', { params })

// POST /api/v1/communications
export const createCommunicationApi = (data) =>
  axiosInstance.post('/communications', data)

// GET /api/v1/communications/:id
export const getCommunicationByIdApi = (id) =>
  axiosInstance.get(`/communications/${id}`)

// DELETE /api/v1/communications/:id  — SuperAdmin
export const deleteCommunicationApi = (id) =>
  axiosInstance.delete(`/communications/${id}`)
