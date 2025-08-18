import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css';
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

const qc = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <App />
      <Toaster
        richColors
        position="bottom-right"
        closeButton
        expand
        theme="system"   // detecta light/dark por clase "dark"
      />
    </QueryClientProvider>
  </StrictMode>,
)
