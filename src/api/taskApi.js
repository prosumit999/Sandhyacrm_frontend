import axiosInstance from './axios'

// GET /api/v1/tasks
export const getAllTasksApi = (params) =>
  axiosInstance.get('/tasks', { params })

// POST /api/v1/tasks
export const createTaskApi = (data) =>
  axiosInstance.post('/tasks', data)

// GET /api/v1/tasks/:id
export const getTaskByIdApi = (id) =>
  axiosInstance.get(`/tasks/${id}`)

// PUT /api/v1/tasks/:id
export const updateTaskApi = (id, data) =>
  axiosInstance.put(`/tasks/${id}`, data)

// DELETE /api/v1/tasks/:id
export const deleteTaskApi = (id) =>
  axiosInstance.delete(`/tasks/${id}`)
