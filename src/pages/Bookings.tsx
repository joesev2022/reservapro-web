import { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/api/http'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/auth'

type Venue = { id: string; name: string }
type Booking = {
  id: string
  title?: string
  startAt: string // ISO (UTC)
  endAt: string   // ISO (UTC)
  venue: Venue
}

export default function Bookings() {
  const qc = useQueryClient()
  const { user } = useAuth()

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

  useEffect(() => {
    if (!venueId && venuesQ.data?.length) setVenueId(venuesQ.data[0].id)
  }, [venuesQ.data, venueId])

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
      end: b.endAt
    }))
  }, [bookingsQ.data])

  async function onSelect(sel: DateSelectArg) {
    if (!venueId) return
    const ok = confirm(`Crear reserva\n${sel.start.toLocaleString()} - ${sel.end?.toLocaleString()}`)
    if (!ok) return
    await http.post('/bookings', {
      venueId,
      startAt: sel.start.toISOString(), // pasa UTC al backend
      endAt: sel.end?.toISOString(),
    })
    qc.invalidateQueries({ queryKey: ['bookings'] })
  }

  async function onDrop(arg: EventDropArg) {
    await http.patch(`/bookings/${arg.event.id}`, {
      startAt: arg.event.start?.toISOString(),
      endAt: arg.event.end?.toISOString(),
    })
    qc.invalidateQueries({ queryKey: ['bookings'] })
  }

  async function onResize(arg: EventResizeDoneArg) {
    await http.patch(`/bookings/${arg.event.id}`, {
      startAt: arg.event.start?.toISOString(),
      endAt: arg.event.end?.toISOString(),
    })
    qc.invalidateQueries({ queryKey: ['bookings'] })
  }

  async function deleteSelected() {
    const id = prompt('ID de la reserva a eliminar:')
    if (!id) return
    await http.delete(`/bookings/${id}`)
    qc.invalidateQueries({ queryKey: ['bookings'] })
  }

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
            <Button variant="outline" onClick={deleteSelected}>Eliminar por ID</Button>
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
            datesSet={(info) => {
              // pide datos del rango visible
              setRange({
                from: info.start.toISOString(),
                to: info.end.toISOString(),
              })
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
