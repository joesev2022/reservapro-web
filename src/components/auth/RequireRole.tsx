import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/store/auth'

export function RequireAuth() {
  const { user, token } = useAuth()
  const hydrated = (useAuth as any).persist?.hasHydrated?.() ?? true;
  if (!hydrated) return <div className="p-6">Cargando…</div>;
  return (user || token) ? <Outlet/> : <Navigate to="/login" replace />;
}

export function RequireRole({ roles }: { roles: ('admin'|'trabajador'|'cliente')[] }) {
  const { user, token } = useAuth()
  const hydrated = (useAuth as any).persist?.hasHydrated?.() ?? true;
  if (!hydrated) return <div className="p-6">Cargando…</div>;
  if (!(user || token)) return <Navigate to="/login" replace />;
  return user && roles.includes(user.role) ? <Outlet/> : <Navigate to="/forbidden" replace />;
}
