import portalAxios from './portalAxios'
import axiosInstance from './axios'

// ── Admin-side ────────────────────────────────────────────────────────────────
export const enablePortalAccessApi    = (id, data) => axiosInstance.patch(`/portal/admin/customers/${id}/portal-access`, data)
export const adminGetPortalMsgsApi    = (cid)      => axiosInstance.get(`/portal/admin/customers/${cid}/messages`)
export const adminSendPortalMsgApi    = (cid, data) => axiosInstance.post(`/portal/admin/customers/${cid}/messages`, data)

// ── Portal customer ───────────────────────────────────────────────────────────
export const portalLoginApi             = (data)   => portalAxios.post('/portal/auth/login', data)
export const portalLogoutApi            = ()        => portalAxios.post('/portal/auth/logout')
export const portalMeApi                = ()        => portalAxios.get('/portal/auth/me')
export const portalForgotPasswordApi    = (data)   => portalAxios.post('/portal/auth/forgot-password', data)
export const portalResetPasswordApi     = (token, data) => portalAxios.post(`/portal/auth/reset-password/${token}`, data)
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
export const portalUnreadCountApi  = ()        => portalAxios.get('/portal/messages/unread')
export const portalAllSoftwaresApi      = ()        => portalAxios.get('/softwares')
export const portalOrgSettingsApi       = ()        => portalAxios.get('/portal/org-settings')
export const portalUpdateMeApi          = (data)   => portalAxios.put('/portal/auth/me', data)
export const portalChangePasswordApi    = (data)   => portalAxios.put('/portal/auth/change-password', data)

// ── Portal notifications ──────────────────────────────────────────────────────
export const portalNotifsApi            = (params) => portalAxios.get('/portal/notifications', { params })
export const portalNotifUnreadCountApi  = ()        => portalAxios.get('/portal/notifications/unread-count')
export const portalMarkNotifReadApi     = (id)      => portalAxios.patch(`/portal/notifications/${id}/read`)
export const portalMarkAllNotifsReadApi = ()        => portalAxios.patch('/portal/notifications/mark-all-read')
export const portalDismissNotifApi      = (id)      => portalAxios.patch(`/portal/notifications/${id}/dismiss`)
