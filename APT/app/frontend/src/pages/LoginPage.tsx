import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const { loginWithCredentials } = useAuth()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await loginWithCredentials(email, password)
      nav('/app', { replace: true })
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'No se pudo iniciar sesión. Revisa tus credenciales.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 380, margin: '64px auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Ingresar</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        {error && <div style={{ color:'red' }}>{error}</div>}
      </form>
      <p style={{ marginTop: 8, fontSize: 12, color:'#6b7280' }}>Usa tu usuario demo de backend.</p>
    </main>
  )
}
