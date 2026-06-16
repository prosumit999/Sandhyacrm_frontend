import axiosInstance from './axios'

// GET /api/v1/invoices
export const getAllInvoicesApi = (params) =>
  axiosInstance.get('/invoices', { params })

// POST /api/v1/invoices  — SuperAdmin, Admin
export const createInvoiceApi = (data) =>
  axiosInstance.post('/invoices', data)

// GET /api/v1/invoices/:id
export const getInvoiceByIdApi = (id) =>
  axiosInstance.get(`/invoices/${id}`)

// PUT /api/v1/invoices/:id  — SuperAdmin, Admin
export const updateInvoiceApi = (id, data) =>
  axiosInstance.put(`/invoices/${id}`, data)

// PATCH /api/v1/invoices/:id/mark-paid  — SuperAdmin, Admin
export const markInvoicePaidApi = (id, data) =>
  axiosInstance.patch(`/invoices/${id}/mark-paid`, data)
