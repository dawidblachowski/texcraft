import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'
import router from '../router'

const httpClient = axios.create({
  baseURL: '/api', // Base server URL
  timeout: 10000,  // Timeout duration
})

httpClient.interceptors.request.use(
  (config) => {
    // Get the access token from the store
    const authStore = useAuthStore()
    if (authStore.isAuthenticated && authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

httpClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    // If the error is due to an expired token and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // Refresh the token
        await authStore.refreshToken()
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`
        return httpClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        authStore.logout()
        router.push('/login')
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default httpClient
