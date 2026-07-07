import axios from 'axios'
import { getApiBaseUrl } from './apiBase'

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  // Required: the backend sets httpOnly cookies; credentials must be included
  // on every cross-origin request so the browser sends them.
  withCredentials: true,
})

let isRefreshing = false
let pendingQueue = []

const processQueue = (error) => {
  pendingQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve()))
  pendingQueue = []
}

// Response interceptor — handle expired access token transparently.
// When the backend returns 401, attempt one silent refresh via the
// /auth/refresh endpoint (which re-issues the logintoken cookie), then
// replay the original request. If refresh also fails, redirect to /login.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then(() => axiosInstance(original))
      }

      original._retry = true
      isRefreshing = true

      try {
        await axiosInstance.post('/auth/refresh')
        processQueue(null)
        return axiosInstance(original)
      } catch (refreshError) {
        processQueue(refreshError)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
