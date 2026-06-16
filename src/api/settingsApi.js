import axiosInstance from './axios'

export const getInvoiceSettingsApi    = ()     => axiosInstance.get('/settings')
export const updateInvoiceSettingsApi = (data) => axiosInstance.put('/settings', data)
