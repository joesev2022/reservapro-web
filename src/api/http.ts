import axios from 'axios'
import { useAuth } from '@/store/auth'
import { toast } from 'sonner'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001'
})

http.interceptors.request.use((config) => {
  const token = useAuth.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  res => res,
  (err) => {
    const msg = err?.response?.data?.message || err.message || 'Error de red'
    toast.error(Array.isArray(msg) ? msg.join(', ') : msg)
    return Promise.reject(err)
  }
)