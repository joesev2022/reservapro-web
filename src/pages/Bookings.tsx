import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventDropArg, EventApi } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/api/http'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/auth'
import { getSocket } from '@/lib/socket'
import { toast } from 'sonner'
import type { EventClickArg } from '@fullcalendar/core'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Venue = { id: string; name: string }
type UserMini = { id: string; role?: 'admin'|'trabajador'|'cliente'; name?: string }
type Booking = {
  id: string
  title?: string
  startAt: string // ISO (UTC)
  endAt: string   // ISO (UTC)
  venue: Venue
  user?: UserMini // 👈 importante para permisos en el front
  status: 'pending' | 'paid' | 'cancelled'
}

export default function Bookings() {
  const qc = useQueryClient()
  const me = useAuth(s => s.user)
  const role = me?.role
  const meId = me?.id

  // Si aún NO tienes endpoint GET /venues, pon temporalmente el ID de tu seed:
  // const [venueId, setVenueId] = useState<string>(import.meta.env.VITE_DEFAULT_VENUE_ID!)
  const [venueId, setVenueId] = useState<string | null>(null)

  // Rango visible en el calendario (para pedir solo lo necesario)
  const [range, setRange] = useState<{from: string, to: string} | null>(null)

  // (Opcional) cargar locales si ya expusiste GET /venues
  const venuesQ = useQuery<Venue[]>({
    queryKey: ['venues'],
    queryFn: async () => (await http.get('/venues')).data,
    staleTime: 5 * 60_000,
  })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<{ id: string; title: string; start?: Date|null; end?: Date|null; ownerId?: string } | null>(null)

  useEffect(() => {
    if (!venueId && venuesQ.data?.length) setVenueId(venuesQ.data[0].id)
  }, [venuesQ.data, venueId])

  const loc = useLocation()
  useEffect(() => {
    const sp = new URLSearchParams(loc.search)
    const id = sp.get('venueId')
    if (id) setVenueId(id)
  }, [loc.search])

  // Cargar reservas del rango
  const bookingsQ = useQuery<Booking[]>({
    queryKey: ['bookings', venueId, range?.from, range?.to],
    enabled: Boolean(venueId && range),
    queryFn: async () => {
      const { data } = await http.get('/bookings', {
        params: { venueId, from: range!.from, to: range!.to }
      })
      return data
    }
  })

  // Convertir a eventos del calendario
  const events = useMemo(() => {
    if (!bookingsQ.data) return []
    return bookingsQ.data.map(b => ({
      id: b.id,
      title: b.title ?? 'Reserva',
      start: b.startAt, // ISO UTC; FullCalendar los interpreta ok
      end: b.endAt,
      extendedProps: { userId: b.user?.id }, // 👈 lo usamos en eventAllow
    }))
  }, [bookingsQ.data])

  async function onSelect(sel: DateSelectArg) {
    if (!venueId) return
    const ok = confirm(`Crear reserva\n${sel.start.toLocaleString()} - ${sel.end?.toLocaleString()}`)
    if (!ok) return
    try {
      await http.post('/bookings', {
        title: 'Reserva',
        venueId,
        startAt: sel.start.toISOString(), // pasa UTC al backend
        endAt: sel.end?.toISOString(),
      })
      toast.success('Reserva creada')
      qc.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error(err)
    }
  }

  async function onDrop(arg: EventDropArg) {
    try {
      await http.patch(`/bookings/${arg.event.id}`, {
        startAt: arg.event.start?.toISOString(),
        endAt: arg.event.end?.toISOString(),
      })
      toast.success('Reserva actualizada')
      qc.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      toast.error('Error al actualizar la reserva')
      console.error(err)
      arg.revert() // 👈 vuelve si 400/403/etc.
    }
  }

  async function onResize(arg: EventResizeDoneArg) {
    try {
      await http.patch(`/bookings/${arg.event.id}`, {
        startAt: arg.event.start?.toISOString(),
        endAt: arg.event.end?.toISOString(),
      })
      toast.success('Reserva actualizada')
      qc.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      toast.error('Error al actualizar la reserva')
      console.error(err)
      arg.revert()
    }
  }

  async function deleteSelected() {
    const id = prompt('ID de la reserva a eliminar:')
    if (!id) return
    try {
      await http.delete(`/bookings/${id}`)
      toast.success('Reserva eliminada')
      qc.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error(err)
    }
  }

  function onEventClick(arg: EventClickArg) {
    const e = arg.event
    setEditing({
      id: e.id,
      title: e.title || '',
      start: e.start,
      end: e.end,
      ownerId: (e.extendedProps as any)?.userId as string | undefined,
    })
    setOpen(true)
  }

  const canEditThis = (evOwner?: string) =>
  role === 'admin' || role === 'trabajador' || evOwner === meId

  useEffect(() => {
    const s = getSocket();
    const invalidate = () => qc.invalidateQueries({ queryKey: ['bookings'] });
    s.on('booking.created', invalidate);
    s.on('booking.updated', invalidate);
    s.on('booking.deleted', invalidate);
    return () => {
      s.off('booking.created', invalidate);
      s.off('booking.updated', invalidate);
      s.off('booking.deleted', invalidate);
    };
  }, [qc]);

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Reservas</h2>
            {venuesQ.data && (
              <select
                className="border rounded px-2 py-1"
                value={venueId ?? ''}
                onChange={e => setVenueId(e.target.value)}
              >
                {venuesQ.data.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            )}
            {(role === 'admin' || role === 'trabajador') && (
              <Button variant="outline" onClick={deleteSelected}>Eliminar por ID</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <FullCalendar
            height="75vh"
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            timeZone="local"          // FullCalendar muestra en tu zona; enviamos/recibimos ISO (UTC)
            selectable
            editable
            events={events}
            select={onSelect}
            eventDrop={onDrop}
            eventResize={onResize}
            eventAllow={(_dropInfo: any, draggedEvent: EventApi | null) => {
              if (role === 'admin' || role === 'trabajador') return true
              if (!draggedEvent) return false // arrastre externo: no permitir al cliente
              const ownerId = (draggedEvent.extendedProps as any)?.userId as string | undefined
              return ownerId === meId
            }}
            datesSet={(info) => {
              // pide datos del rango visible
              setRange({
                from: info.start.toISOString(),
                to: info.end.toISOString(),
              })
            }}
            eventClick={onEventClick}
          />
        </CardContent>
      </Card>
      
      {/* 👇 Modal Editar Reserva */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar reserva</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input
                value={editing?.title ?? ''}
                onChange={e => setEditing(ed => ed ? ({ ...ed, title: e.target.value }) : ed)}
                disabled={!canEditThis(editing?.ownerId)}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Dueño: {editing?.ownerId === meId ? 'Tú' : (bookingsQ.data?.find(b => b.id === editing?.id)?.user?.name ?? '—')}
            </div>
            <div className="text-sm text-muted-foreground">
              {editing?.start?.toLocaleString()} — {editing?.end?.toLocaleString()}
            </div>
          </div>

          <DialogFooter className="gap-2">

            {editing && (bookingsQ.data?.find(b => b.id === editing.id)?.status !== 'paid') && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const { data } = await http.post('/payments/checkout', { bookingId: editing.id })
                    toast('Redirigiendo a Mercado Pago…')
                    window.open(data.initPoint, '_self') // o window.location.href = data.initPoint
                  } catch {}
                }}
              >
                Pagar
              </Button>
            )}


            <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>

            {canEditThis(editing?.ownerId) && (
              <>
                <Button
                  onClick={async () => {
                    if (!editing) return
                    try {
                      await http.patch(`/bookings/${editing.id}`, { title: editing.title })
                      toast.success('Reserva actualizada')
                      setOpen(false)
                      qc.invalidateQueries({ queryKey: ['bookings'] })
                    } catch {}
                  }}
                >
                  Guardar
                </Button>

                {(role === 'admin' || role === 'trabajador' || editing?.ownerId === meId) && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!editing) return
                      if (!confirm('¿Eliminar esta reserva?')) return
                      try {
                        await http.delete(`/bookings/${editing.id}`)
                        toast.success('Reserva eliminada')
                        setOpen(false)
                        qc.invalidateQueries({ queryKey: ['bookings'] })
                      } catch {}
                    }}
                  >
                    Eliminar
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
