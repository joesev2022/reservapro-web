import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RequireAuth, RequireRole } from '@/components/auth/RequireRole'
import AppShell from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import Bookings from '@/pages/Bookings'
import MapPage from '@/pages/Maps'
import AdminStats from '@/pages/AdminStats'
import Login from '@/pages/Login'
import Forbidden from '@/pages/Forbidden'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route element={<RequireAuth/>}>
          <Route element={<AppShell/>}>
            <Route index element={<Dashboard/>} />
            <Route path="bookings" element={<Bookings/>} />
            <Route path="map" element={<MapPage/>} />
            <Route element={<RequireRole roles={['admin']}/>}>
              <Route path="admin/stats" element={<AdminStats/>} />
            </Route>
          </Route>
        </Route>
        <Route path="/forbidden" element={<Forbidden/>} />
      </Routes>
    </BrowserRouter>
  )
}