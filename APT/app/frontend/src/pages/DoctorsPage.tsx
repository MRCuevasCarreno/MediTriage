import { useEffect, useState } from 'react'
import { get } from '../lib/api'

export default function DoctorsPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await get<any>('/Doctors', { PageNumber: 1, PageSize: 20, SortBy: 'id', SortDirection: 'asc' })
        setData(res)
      } catch (e: any) {
        setError(e?.message || 'Error cargando doctores')
      }
    })()
  }, [])

  return (
    <section>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Doctores</h2>
      {error && <p style={{ color:'red' }}>{error}</p>}
      <ul>
        {(data?.items || data || []).map((d: any, i: number) => (
          <li key={d.id ?? i} style={{ borderBottom:'1px solid #eee', padding:'6px 0' }}>
            #{d.id} — {d.fullName || d.name} ({d.specialty || d.email || ''})
          </li>
        ))}
      </ul>
    </section>
  )
}
