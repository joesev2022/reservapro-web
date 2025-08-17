import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="min-h-screen grid md:grid-cols-[16rem_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Topbar />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}