import { useQuery } from '@tanstack/react-query'
import { fetchOverview, type Overview } from '@/api/reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { format } from 'date-fns'

export default function Dashboard() {
  const q = useQuery<Overview>({ queryKey: ['reports','overview'], queryFn: () => fetchOverview() })

  const series = q.data?.series ?? []
  const total = q.data?.totals.bookings ?? 0
  const top = q.data?.totals.byVenue ?? []

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat title="Reservas (30 días)" value={String(total)} />
        <Stat title="Locales activos" value={String(top.length)} />
        <Stat title="Vista" value="Últimos 30 días" />
        <Stat title="Estado" value={<Badge>OK</Badge> as any} />
      </div>

      <Card>
        <CardHeader><CardTitle>Reservas por día</CardTitle></CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopOpacity={0.3}/>
                  <stop offset="100%" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'MM-dd')} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={(d) => format(new Date(d), 'PP')} />
              <Area type="monotone" dataKey="count" fill="url(#g1)" strokeOpacity={0.8}/>
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top locales por reservas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Reservas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(top.length ? top : [{ name: '—', count: 0 }]).map((v: any) => (
                <TableRow key={v.id ?? v.name}>
                  <TableCell>{v.name}</TableCell>
                  <TableCell className="text-right">{v.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}
