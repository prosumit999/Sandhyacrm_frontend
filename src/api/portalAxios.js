import axios from 'axios'

const portalAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Redirect to login on 401 only when the request was to a portal endpoint.
// Non-portal endpoints (e.g. /softwares) may also return 401 if they require
// CRM-staff auth — those should fail silently, not kick the customer out.
portalAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    const isPortalEndpoint = err.config?.url?.startsWith('/portal/')
    if (err.response?.status === 401 && isPortalEndpoint && window.location.pathname.startsWith('/portal/')) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default portalAxios
