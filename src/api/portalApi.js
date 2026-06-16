import portalAxios from './portalAxios'
import axiosInstance from './axios'

// ── Admin-side ────────────────────────────────────────────────────────────────
export const enablePortalAccessApi    = (id, data) => axiosInstance.patch(`/portal/admin/customers/${id}/portal-access`, data)
export const adminGetPortalMsgsApi    = (cid)      => axiosInstance.get(`/portal/admin/customers/${cid}/messages`)
export const adminSendPortalMsgApi    = (cid, data) => axiosInstance.post(`/portal/admin/customers/${cid}/messages`, data)

// ── Portal customer ───────────────────────────────────────────────────────────
export const portalLoginApi        = (data)   => portalAxios.post('/portal/auth/login', data)
export const portalLogoutApi       = ()        => portalAxios.post('/portal/auth/logout')
export const portalMeApi           = ()        => portalAxios.get('/portal/auth/me')
export const portalDashboardApi    = ()        => portalAxios.get('/portal/dashboard')
export const portalSubscriptionsApi= ()        => portalAxios.get('/portal/subscriptions')
export const portalInvoicesApi     = ()        => portalAxios.get('/portal/invoices')
export const portalAlertsApi       = ()        => portalAxios.get('/portal/alerts')
export const portalTicketsApi      = ()        => portalAxios.get('/portal/tickets')
export const portalCreateTicketApi = (data)   => portalAxios.post('/portal/tickets', data)
export const portalTicketDetailApi = (id)     => portalAxios.get(`/portal/tickets/${id}`)
export const portalReplyTicketApi  = (id, data) => portalAxios.post(`/portal/tickets/${id}/reply`, data)
export const portalTeamApi         = ()        => portalAxios.get('/portal/team')
export const portalMessagesApi     = ()        => portalAxios.get('/portal/messages')
export const portalSendMessageApi  = (data)   => portalAxios.post('/portal/messages', data)
