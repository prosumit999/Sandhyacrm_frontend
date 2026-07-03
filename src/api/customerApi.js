import axiosInstance from './axios'

// GET /api/v1/customers
export const getAllCustomersApi = (params) =>
  axiosInstance.get('/customers', { params })

// POST /api/v1/customers
export const createCustomerApi = (data) =>
  axiosInstance.post('/customers', data)

// GET /api/v1/customers/:id
export const getCustomerByIdApi = (id) =>
  axiosInstance.get(`/customers/${id}`)

// PUT /api/v1/customers/:id
export const updateCustomerApi = (id, data) =>
  axiosInstance.put(`/customers/${id}`, data)

// DELETE /api/v1/customers/:id  — SuperAdmin
export const deleteCustomerApi = (id) =>
  axiosInstance.delete(`/customers/${id}`)

// GET /api/v1/customers/:id/subscriptions
export const getCustomerSubscriptionsApi = (id) =>
  axiosInstance.get(`/customers/${id}/subscriptions`)

// GET /api/v1/customers/:id/invoices
export const getCustomerInvoicesApi = (id) =>
  axiosInstance.get(`/customers/${id}/invoices`)

// GET /api/v1/customers/export
export const exportCustomersApi = (params) =>
  axiosInstance.get('/customers/export', { params, responseType: 'blob' })
