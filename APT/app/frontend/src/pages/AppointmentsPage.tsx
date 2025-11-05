import { useEffect, useState } from 'react'
import { baseURL } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

export default function AppointmentsPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchAppointments() {
      setLoading(true)
      setError(null)
      try {
        const headers: Record<string,string> = { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' }
        if (token) headers.Authorization = `Bearer ${token}`
        // Determinar doctorId: si el usuario es doctor, preferir /api/Doctors/me (devuelve data.data.id)
        let doctorId: number | null = null
        try {
          if (user?.role === 'doctor' || String(user?.role).toLowerCase() === 'doctor') {
            const tk = token || localStorage.getItem('token') || ''
            if (tk) {
              const meRes = await fetch(`${baseURL}/api/Doctors/me`, {
                method: 'GET',
                headers: { Accept: 'application/json, text/plain, */*', Authorization: `Bearer ${tk}` }
              })
              if (meRes.ok) {
                const meJson = await meRes.json()
                doctorId = meJson?.data?.id ?? meJson?.id ?? null
              }
            }
          }
        } catch (err) {
          // ignore and fallback
        }

        if (!doctorId) {
          const uid = user?.doctorId ?? user?.id ?? null
          doctorId = uid ? Number(uid) : null
        }

        if (!doctorId) {
          setError('No se encontró el ID del médico en la sesión')
          setData([])
          setLoading(false)
          return
        }

        const res = await fetch(`${baseURL}/api/Doctors/calendar`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ id: doctorId })
        })

        if (!res.ok) throw new Error(`Error cargando citas: ${res.status}`)
        const json = await res.json()

        const notAvail = json?.data?.appointmentsNotAvalable && Array.isArray(json.data.appointmentsNotAvalable)
          ? json.data.appointmentsNotAvalable
          : []

        if (!cancelled) setData(notAvail)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Error cargando citas')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAppointments()
    return () => { cancelled = true }
  }, [token, user])

  return (
    <section>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Citas</h2>
      {loading && <p>Cargando citas...</p>}
      {error && <p style={{ color:'red' }}>{error}</p>}
      <ul>
        {(data || []).map((a: any, i: number) => (
          <li key={a.appointmentID ?? a.id ?? i} style={{ borderBottom:'1px solid #eee', padding:'6px 0' }}>
            {a.appointmentID ? `#${a.appointmentID}` : `#${a.id ?? i}`} — Paciente {a.patientId ?? a.patient?.id ?? a.patientId} — {a.hour ?? a.start} — estado: {a.status ?? a.state}
          </li>
        ))}
      </ul>
    </section>
  )
}
