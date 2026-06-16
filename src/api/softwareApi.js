import axiosInstance from './axios'

// GET /api/v1/softwares
export const getAllSoftwaresApi = (params) =>
  axiosInstance.get('/softwares', { params })

// POST /api/v1/softwares  — SuperAdmin, Admin
export const createSoftwareApi = (data) =>
  axiosInstance.post('/softwares', data)

// GET /api/v1/softwares/:id
export const getSoftwareByIdApi = (id) =>
  axiosInstance.get(`/softwares/${id}`)

// PUT /api/v1/softwares/:id  — SuperAdmin, Admin
export const updateSoftwareApi = (id, data) =>
  axiosInstance.put(`/softwares/${id}`, data)

// DELETE /api/v1/softwares/:id  — SuperAdmin
export const deleteSoftwareApi = (id) =>
  axiosInstance.delete(`/softwares/${id}`)

// GET /api/v1/softwares/:id/customers
export const getSoftwareCustomersApi = (id) =>
  axiosInstance.get(`/softwares/${id}/customers`)
