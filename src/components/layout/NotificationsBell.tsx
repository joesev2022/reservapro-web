import { useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Bell, Pencil, Trash2, PlusCircle, CheckCheck, X } from 'lucide-react'
import { useNotifications } from '@/store/notifications'
import { getSocket } from '@/lib/socket'
import { toast } from 'sonner'

// icono según tipo
function KindIcon({ kind }: { kind: 'created'|'updated'|'deleted' }) {
  const C = kind === 'created' ? PlusCircle : kind === 'updated' ? Pencil : Trash2
  return <C className="h-4 w-4" />
}

export default function NotificationsBell() {
  const { items, push, markAllRead, clear, remove } = useNotifications()

  // contador no leídos
  const unread = useMemo(() => items.filter(i => !i.read).length, [items])

  // suscripción a sockets una sola vez
  useEffect(() => {
    const s = getSocket()

    const onCreated = (p: any) => {
      push({ kind: 'created', bookingId: p.id, title: p.title, startAt: p.startAt, endAt: p.endAt, venueId: p.venueId })
      toast.success(`Reserva creada${p.title ? `: ${p.title}` : ''}`)
    }
    const onUpdated = (p: any) => {
      push({ kind: 'updated', bookingId: p.id, title: p.title, startAt: p.startAt, endAt: p.endAt, venueId: p.venueId })
      toast(`Reserva actualizada${p.title ? `: ${p.title}` : ''}`)
    }
    const onDeleted = (p: any) => {
      push({ kind: 'deleted', bookingId: p.id, title: p.title, startAt: p.startAt, endAt: p.endAt, venueId: p.venueId })
      toast.warning('Reserva eliminada')
    }

    s.on('booking.created', onCreated)
    s.on('booking.updated', onUpdated)
    s.on('booking.deleted', onDeleted)

    return () => {
      s.off('booking.created', onCreated)
      s.off('booking.updated', onUpdated)
      s.off('booking.deleted', onDeleted)
    }
  }, [push])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] leading-[18px] text-center px-1">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Marcar leídas
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clear}>
              <X className="h-3.5 w-3.5 mr-1" /> Limpiar
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Sin notificaciones</div>
          ) : (
            items.map(n => (
              <DropdownMenuItem key={n.id} className="py-2 px-3 gap-3 focus:bg-muted/60">
                <div className="mt-1"><KindIcon kind={n.kind} /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">
                    {n.kind === 'created' && 'Reserva creada'}
                    {n.kind === 'updated' && 'Reserva actualizada'}
                    {n.kind === 'deleted' && 'Reserva eliminada'}
                    {n.title ? ` · ${n.title}` : ''}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {n.startAt ? new Date(n.startAt).toLocaleString() : ''}{n.endAt ? ` — ${new Date(n.endAt).toLocaleString()}` : ''}
                  </div>
                </div>
                {!n.read && <Badge variant="secondary" className="ml-auto">Nuevo</Badge>}
                <Button variant="ghost" size="icon" onClick={() => remove(n.id)} className="ml-1">
                  <X className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
