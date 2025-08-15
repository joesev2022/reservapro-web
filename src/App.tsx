
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import AdminStats from '@/pages/AdminStats'
import Forbidden from '@/pages/Forbidden'
import Bookings from '@/pages/Bookings'
import { RequireAuth, RequireRole } from '@/components/auth/RequireRole'
import { Button } from "@/components/ui/button"
import { Toaster, toast } from 'sonner'
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route element={<RequireAuth/>}>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/bookings" element={<Bookings/>} />
          <Route element={<RequireRole roles={['admin']}/>}>
            <Route path="/admin/stats" element={<AdminStats/>} />
          </Route>
        </Route>
        <Route path="/forbidden" element={<Forbidden/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
