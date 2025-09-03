import { useEffect, useState } from 'react'
import { get } from '../lib/api'

type Me = { email?: string, fullName?: string, role?: string }
type Count = { label: string, value: number }

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null)
  const [counts, setCounts] = useState<Count[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const meRes = await get<Me>('/me')
        setMe(meRes)
      } catch {
        // ignore
      }
      try {
        // simple counts by fetching first pages
        const [docs, pats, apps] = await Promise.all([
          get<any>('/Doctors', { PageNumber: 1, PageSize: 1 }),
          get<any>('/Patients', { PageNumber: 1, PageSize: 1 }),
          get<any>('/Appointments', { PageNumber: 1, PageSize: 1 }),
        ])
        const c: Count[] = [
          { label: 'Doctores', value: Array.isArray(docs?.items) ? docs.items.length : (docs?.total || 0) },
          { label: 'Pacientes', value: Array.isArray(pats?.items) ? pats.items.length : (pats?.total || 0) },
          { label: 'Citas', value: Array.isArray(apps?.items) ? apps.items.length : (apps?.total || 0) },
        ]
        setCounts(c)
      } catch (e: any) {
        setError(e?.message || 'No se pudieron cargar indicadores.')
      }
    })()
  }, [])

  return (
    <section>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Panel</h2>
      {me && <p>Sesión: <strong>{me.fullName}</strong> ({me.email}) — rol: {me.role}</p>}
      {error && <p style={{ color:'red' }}>{error}</p>}
      <div style={{ display:'flex', gap:12, marginTop: 12 }}>
        {counts?.map((c, i) => (
          <div key={i} style={{ padding:16, border:'1px solid #e5e7eb', borderRadius:8 }}>
            <div style={{ fontSize:12, color:'#6b7280' }}>{c.label}</div>
            <div style={{ fontSize:24, fontWeight:600 }}>{c.value}</div>
          </div>
        ))}
      </div>
      {!counts && <p style={{ color:'#6b7280' }}>Cargando...</p>}
    </section>
  )
}
