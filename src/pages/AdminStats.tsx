import { useEffect, useState } from 'react'
import { http } from '@/api/http'

export default function AdminStats() {
  const [data, setData] = useState<any>(null)
  useEffect(()=>{ http.get('/venues/admin-stats').then(r=>setData(r.data)) },[])
  return <pre className="p-6">{JSON.stringify(data, null, 2)}</pre>
}
