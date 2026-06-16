import axiosInstance from "./axios"

export const getChatUsersApi             = ()           => axiosInstance.get("/chat/users")
export const getConversationsApi         = ()           => axiosInstance.get("/chat/conversations")
export const createConversationApi       = (data)       => axiosInstance.post("/chat/conversations", data)
export const getMessagesApi              = (id, params) => axiosInstance.get(`/chat/conversations/${id}/messages`, { params })
export const getAllConversationsApi       = ()           => axiosInstance.get("/chat/admin/conversations")
export const searchShareInvoicesApi      = (q)          => axiosInstance.get("/chat/share/invoices",      { params: { q } })
export const searchShareSubscriptionsApi = (q)          => axiosInstance.get("/chat/share/subscriptions", { params: { q } })
export const searchShareAlertsApi        = (q)          => axiosInstance.get("/chat/share/alerts",        { params: { q } })
