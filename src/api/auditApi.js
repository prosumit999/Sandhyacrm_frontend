import axiosInstance from './axios'

// GET /api/v1/audit  — SuperAdmin, Admin
export const getAllAuditLogsApi = (params) =>
  axiosInstance.get('/audit', { params })

// GET /api/v1/audit/:id  — SuperAdmin, Admin
export const getAuditLogByIdApi = (id) =>
  axiosInstance.get(`/audit/${id}`)
