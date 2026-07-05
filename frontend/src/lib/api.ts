import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach Bearer token from auth-store
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401 and 5xx
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined

    if (status === 401) {
      useAuthStore.getState().auth.reset()
      // Redirect to sign-in — use window.location to avoid importing router here
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/sign-in')
      ) {
        window.location.href = '/sign-in'
      }
      return Promise.reject(error)
    }

    if (status !== undefined && status >= 500) {
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.title ??
        'Terjadi kesalahan pada server. Coba lagi nanti.'
      toast.error(message)
    }

    return Promise.reject(error)
  }
)
