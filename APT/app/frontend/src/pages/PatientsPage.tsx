import { useEffect, useState } from 'react'
import { get } from '../lib/api'

export default function PatientsPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await get<any>('/Patients', { PageNumber: 1, PageSize: 20, SortBy: 'id', SortDirection: 'asc' })
        setData(res)
      } catch (e: any) {
        setError(e?.message || 'Error cargando pacientes')
      }
    })()
  }, [])

  return (
    <section>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Pacientes</h2>
      {error && <p style={{ color:'red' }}>{error}</p>}
      <ul>
        {(data?.items || data || []).map((p: any, i: number) => (
          <li key={p.id ?? i} style={{ borderBottom:'1px solid #eee', padding:'6px 0' }}>
            #{p.id} — {p.fullName || p.name} ({p.email || ''})
          </li>
        ))}
      </ul>
    </section>
  )
}
