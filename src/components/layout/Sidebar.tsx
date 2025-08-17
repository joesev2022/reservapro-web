import { NavLink, useNavigate } from 'react-router-dom'
import { NAV } from './nav'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const role = user?.role
  const nav = useNavigate()

  function onLogout() {
    logout()
    nav('/login', { replace: true })
    toast.success('Sesión cerrada')
    onNavigate?.()
  }
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="h-14 px-4 flex items-center font-semibold">ReservaPro</div>
      <nav className="flex-1 px-2 py-2 space-y-1">
        {NAV.filter(n => !n.roles || n.roles.includes(role!)).map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                  isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <Separator />

      {/* Usuario + Logout */}
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7">
            <AvatarFallback>{user?.name?.[0] ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user?.name ?? 'Usuario'}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-2" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only md:not-sr-only">Salir</span>
        </Button>
      </div>

      <div className="p-3 text-xs text-muted-foreground">v0.1.0</div>
    </aside>
  )
}