import { useEffect, useState } from 'react'
import { get } from '../lib/api'

export default function AppointmentsPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await get<any>('/Appointments', { PageNumber: 1, PageSize: 20, SortBy: 'start', SortDirection: 'desc' })
        setData(res)
      } catch (e: any) {
        setError(e?.message || 'Error cargando citas')
      }
    })()
  }, [])

  return (
    <section>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Citas</h2>
      {error && <p style={{ color:'red' }}>{error}</p>}
      <ul>
        {(data?.items || data || []).map((a: any, i: number) => (
          <li key={a.id ?? i} style={{ borderBottom:'1px solid #eee', padding:'6px 0' }}>
            #{a.id} — Paciente {a.patientId}, Doctor {a.doctorId}, {a.start} → {a.end} — estado: {a.status}
          </li>
        ))}
      </ul>
    </section>
  )
}
