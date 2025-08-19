import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { http } from '@/api/http'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function PayResult() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const [checking, setChecking] = useState(true)
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    (async () => {
      const payment_id = sp.get('payment_id') || ''
      const preference_id = sp.get('preference_id') || ''
      try {
        const { data } = await http.get('/payments/verify', { params: { payment_id, preference_id } })
        setOk(!!data.approved)
        if (data.approved) toast.success('Pago confirmado')
        else toast.warning('Pago no aprobado aún')
      } catch {
        toast.error('No se pudo verificar el pago')
      } finally {
        setChecking(false)
      }
    })()
  }, [sp])

  return (
    <div className="p-6 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Resultado del pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checking ? 'Verificando con Mercado Pago…' : ok ? '¡Pago aprobado!' : 'Pago pendiente o rechazado.'}
          <div className="flex gap-2">
            <Button onClick={() => nav('/bookings')}>Volver a reservas</Button>
            <Button variant="outline" onClick={() => nav('/')}>Ir al dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
