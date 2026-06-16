import axios from 'axios'

const portalAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Redirect to login on 401 only when the user is inside a portal page
portalAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname.startsWith('/portal/')) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default portalAxios
