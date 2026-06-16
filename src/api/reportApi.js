import axiosInstance from './axios'

// GET /api/v1/reports/revenue  — SuperAdmin, Admin
export const getRevenueReportApi = (params) =>
  axiosInstance.get('/reports/revenue', { params })

// GET /api/v1/reports/subscriptions  — SuperAdmin, Admin
export const getSubscriptionReportApi = (params) =>
  axiosInstance.get('/reports/subscriptions', { params })

// GET /api/v1/reports/softwares  — SuperAdmin, Admin
export const getSoftwareReportApi = (params) =>
  axiosInstance.get('/reports/softwares', { params })

// GET /api/v1/reports/communications  — SuperAdmin, Admin
export const getCommunicationReportApi = (params) =>
  axiosInstance.get('/reports/communications', { params })
