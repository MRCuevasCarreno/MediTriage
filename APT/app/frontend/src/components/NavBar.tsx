import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function NavBar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <nav style={{ display:'flex', gap:12, alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #e5e7eb' }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <strong>MediTriage</strong>
          <Link to="/">Inicio</Link>
        <Link to="/app/doctors">Doctores</Link>
        <Link to="/app/patients">Pacientes</Link>
        <Link to="/app/appointments">Citas</Link>
      </div>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        {user?.fullName && <span>👋 {user.fullName}</span>}
        <button onClick={()=>{ logout(); nav('/login', { replace:true }) }}>
          Salir
        </button>
      </div>
    </nav>
  )
}
