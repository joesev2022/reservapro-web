import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function Topbar() {
  const [open, setOpen] = useState(false)
  const user = useAuth(s => s.user)
  const logout = useAuth(s => s.logout)
  const nav = useNavigate()

  function onLogout() {
    logout()
    nav('/login', { replace: true })
    toast.success('Sesión cerrada')
  }

  return (
    <header className="h-14 border-b bg-background sticky top-0 z-20">
      <div className="h-14 px-3 md:px-6 flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="hidden md:block font-semibold">Dashboard</div>

        <div className="ml-auto flex items-center gap-3">
          <Input placeholder="Buscar..." className="w-56 hidden sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback>{user?.name?.[0] ?? 'U'}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast('Pronto: Perfil')}>Perfil</DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout}>Salir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}