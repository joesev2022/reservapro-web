import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { http } from '@/api/http'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type VerifyResp = {
  approved: boolean
  status?: string
  paymentId?: string
  bookingId?: string
}

export default function PayResult() {
  const qc = useQueryClient()
  const [sp] = useSearchParams()
  const nav = useNavigate()

  const [checking, setChecking] = useState(true)
  const [resp, setResp] = useState<VerifyResp | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const doVerify = useCallback(async () => {
    setChecking(true); setErr(null)
    const payment_id = sp.get('payment_id') || undefined
    const preference_id = sp.get('preference_id') || undefined
    const bookingIdQ = sp.get('bookingId') || undefined

    try {
      let data: VerifyResp
      if (payment_id) {
        // Verifica usando el payment_id (cuando MP lo agrega al query)
        ;({ data } = await http.get('/payments/verify', { params: { payment_id } }))
      } else if (bookingIdQ) {
        // Si llegaste con bookingId (nuestro flujo popup)
        ;({ data } = await http.get('/payments/verify-external', { params: { bookingId: bookingIdQ } }))
      } else if (preference_id) {
        // Fallback (no siempre soportado)
        ;({ data } = await http.get('/payments/verify', { params: { preference_id } }))
      } else {
        setErr('No se recibieron parámetros del pago.'); setChecking(false); return
      }

      setResp(data)
      if (data.approved) {
        toast.success('Pago confirmado')
        // refresca reservas para que el calendario muestre “PAID”
        qc.invalidateQueries({ queryKey: ['bookings'] })
      } else {
        toast.message('Pago no aprobado aún', { description: `Estado: ${data.status ?? 'desconocido'}` })
      }
    } catch {
      setErr('No se pudo verificar el pago')
      toast.error('No se pudo verificar el pago')
    } finally {
      setChecking(false)
    }
  }, [sp, qc])

  useEffect(() => { void doVerify() }, [doVerify])

  const statusColor =
    resp?.approved ? 'bg-green-600' : resp?.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'

  return (
    <div className="p-6 flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Resultado del pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checking && <div>Verificando con Mercado Pago…</div>}

          {!checking && (
            <>
              {err && <div className="text-red-600 text-sm">{err}</div>}

              {!err && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor}`} />
                    <span className="font-medium">
                      {resp?.approved ? '¡Pago aprobado!' :
                        resp?.status === 'pending' ? 'Pago pendiente' :
                        'Pago rechazado o no disponible'}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {resp?.paymentId && <div>payment_id: {resp.paymentId}</div>}
                    {resp?.bookingId && <div>bookingId: {resp.bookingId}</div>}
                    {resp?.status && <div>status: {resp.status}</div>}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={() => nav('/bookings')}>Volver al calendario</Button>
                <Button variant="outline" onClick={() => nav('/')}>Ir al dashboard</Button>
                {!resp?.approved && (
                  <Button variant="ghost" onClick={() => void doVerify()}>
                    Reintentar verificación
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
