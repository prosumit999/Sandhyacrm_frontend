const DEFAULT_API_URL = 'http://localhost:8000/api/v1'

export const getApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL
  const baseUrl = rawUrl.replace(/\/+$/, '')

  if (baseUrl.endsWith('/api/v1')) return baseUrl
  if (baseUrl.endsWith('/api')) return `${baseUrl}/v1`

  return `${baseUrl}/api/v1`
}

export const getSocketBaseUrl = () => getApiBaseUrl().replace(/\/api\/v1$/, '')
