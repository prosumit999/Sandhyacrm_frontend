import axiosInstance from './axios'

// GET /api/v1/tags
export const getAllTagsApi = (params) =>
  axiosInstance.get('/tags', { params })

// POST /api/v1/tags  — SuperAdmin, Admin
export const createTagApi = (data) =>
  axiosInstance.post('/tags', data)

// GET /api/v1/tags/:id
export const getTagByIdApi = (id) =>
  axiosInstance.get(`/tags/${id}`)

// PUT /api/v1/tags/:id  — SuperAdmin, Admin
export const updateTagApi = (id, data) =>
  axiosInstance.put(`/tags/${id}`, data)

// DELETE /api/v1/tags/:id  — SuperAdmin
export const deleteTagApi = (id) =>
  axiosInstance.delete(`/tags/${id}`)
