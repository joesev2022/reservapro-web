import { useState } from 'react'
import { http } from '@/api/http'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('admin@demo.com')
  const [password, setPassword] = useState('123456')
  const login = useAuth(s=>s.login)
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    try {
      e.preventDefault()
      const { data } = await http.post('/auth/login', { email, password })
      login({ token: data.accessToken, user: data.user })
      navigate('/');
      toast.success(`Bienvenido, ${data.user.name}`)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <Card className="w-full max-w-sm">
        <CardHeader><h1 className="text-xl font-semibold">Ingresar</h1></CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" />
            <Button type="submit" className="w-full">Entrar</Button>
            <p className="text-xs text-muted-foreground mt-1">
              También puedes probar: worker@demo.com / client@demo.com
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
