import axios from 'axios'
import { useAuth } from '@/store/auth'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001'
})

http.interceptors.request.use((config) => {
  const token = useAuth.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})