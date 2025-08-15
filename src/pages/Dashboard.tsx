import { useAuth } from '@/store/auth'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  return (
    <div className="p-6 space-y-3">
      <h2 className="text-2xl font-semibold">Hola, {user?.name}</h2>
      <p className="text-muted-foreground">Rol: {user?.role}</p>
      <div className="space-x-3">
        <Link to="/admin/stats" className="underline">Admin stats</Link>
        <Link to="/bookings" className="underline">Reservas</Link>
      </div>
    </div>
  )
}
