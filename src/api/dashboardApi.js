import axiosInstance from './axios'

// GET /api/v1/dashboard/kpis  — SuperAdmin, Admin
export const getKPIsApi = () =>
  axiosInstance.get('/dashboard/kpis')

// GET /api/v1/dashboard/renewals  — SuperAdmin, Admin, Standard
export const getUpcomingRenewalsApi = () =>
  axiosInstance.get('/dashboard/renewals')

// GET /api/v1/dashboard/infra-alerts  — SuperAdmin, Admin
export const getInfraAlertsApi = () =>
  axiosInstance.get('/dashboard/infra-alerts')

// GET /api/v1/dashboard/software-status  — SuperAdmin, Admin
export const getSoftwareStatusApi = () =>
  axiosInstance.get('/dashboard/software-status')

// GET /api/v1/dashboard/recent-activity  — SuperAdmin, Admin
export const getRecentActivityApi = () =>
  axiosInstance.get('/dashboard/recent-activity')

// GET /api/v1/dashboard/alert-summary  — SuperAdmin, Admin
export const getAlertSummaryApi = () =>
  axiosInstance.get('/dashboard/alert-summary')

// GET /api/v1/dashboard/operational-alerts  — SuperAdmin, Admin
export const getOperationalAlertsApi = () =>
  axiosInstance.get('/dashboard/operational-alerts')

// GET /api/v1/dashboard/my-overview  — All roles (Standard user personal stats)
export const getMyOverviewApi = () =>
  axiosInstance.get('/dashboard/my-overview')
