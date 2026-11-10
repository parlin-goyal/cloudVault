import axios from 'axios'

/**
 * Shared Axios instance for all API calls.
 * - baseURL "/api": requests go to the same origin (Vite proxy in development, Nginx in production)
 * - withCredentials: sends the HttpOnly login cookie
 * - X-Requested-With: required by the server's CSRF protection
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

let onUnauthorized = null

/** Lets AuthContext log the user out automatically when the session expires. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isAuthCall = url.startsWith('/auth/')
    if (status === 401 && !isAuthCall && onUnauthorized) {
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

export default api
