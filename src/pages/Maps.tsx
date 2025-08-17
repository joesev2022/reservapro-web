import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '@/lib/leaflet-fix-icons';
import '@/lib/leaflet-icons' // fija los icons
import { http } from '@/api/http'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

type Venue = { id: string; name: string; lat?: number; lng?: number }

const LIMA: [number, number] = [-12.0464, -77.0428]

function haversine(a: [number,number], b: [number,number]) {
  const R = 6371
  const toRad = (x:number)=>x*Math.PI/180
  const dLat = toRad(b[0]-a[0]); const dLng = toRad(b[1]-a[1])
  const lat1 = toRad(a[0]); const lat2 = toRad(b[0])
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2
  return 2*R*Math.asin(Math.sqrt(h)) // km
}

export default function MapPage(){
  const navigate = useNavigate()
  const [center, setCenter] = useState<[number,number]>(LIMA)
  const [userPos, setUserPos] = useState<[number,number] | null>(null)

  // geolocalización
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number,number] = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(p)
        setCenter(p)
      },
      () => {/*silencio*/},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  // locales
  const venuesQ = useQuery<Venue[]>({
    queryKey: ['venues'],
    queryFn: async () => (await http.get('/venues')).data,
  })

  const venues = useMemo(() => {
    if (!venuesQ.data) return []
    return venuesQ.data
      .filter(v => typeof v.lat === 'number' && typeof v.lng === 'number')
      .sort((a,b) => {
        if (!userPos) return 0
        return haversine(userPos, [a.lat!, a.lng!]) - haversine(userPos, [b.lat!, b.lng!])
      })
  }, [venuesQ.data, userPos])

  function goToCalendar(v: Venue) {
    navigate(`/bookings?venueId=${v.id}`)
  }

  return (
    <div className="p-6 space-y-3">
      <h2 className="text-xl font-semibold">Mapa de locales</h2>
      <div className="rounded-lg overflow-hidden shadow">
        <MapContainer center={center} zoom={13} style={{ height: 520 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          {userPos && (
            <>
              <Marker position={userPos}><Popup>Tú estás aquí</Popup></Marker>
              <Circle center={userPos} radius={300} pathOptions={{ color: 'blue' }} />
            </>
          )}
          {venues.map(v => (
            <Marker key={v.id} position={[v.lat!, v.lng!]}>
              <Popup>
                <div className="space-y-2">
                  <div className="font-semibold">{v.name}</div>
                  {userPos && <div className="text-sm text-muted-foreground">
                    ~{haversine(userPos,[v.lat!,v.lng!]).toFixed(1)} km
                  </div>}
                  <Button size="sm" onClick={()=>goToCalendar(v)}>Abrir calendario</Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
