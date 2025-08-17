import { LayoutDashboard, CalendarClock, Map as MapIcon, ShieldCheck } from 'lucide-react'

export type NavItem = { to: string; label: string; icon: any; roles?: ('admin'|'trabajador'|'cliente')[] }

export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bookings', label: 'Reservas', icon: CalendarClock, roles: ['admin','trabajador','cliente'] },
  { to: '/map', label: 'Mapa', icon: MapIcon, roles: ['admin','trabajador','cliente'] },
  { to: '/admin/stats', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
]