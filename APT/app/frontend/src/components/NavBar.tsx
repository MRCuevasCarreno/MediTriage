import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function NavBar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  const handleLogout = () => {
    // Limpia variables y almacenamiento
    localStorage.clear()
    sessionStorage.clear()

    // Si usas variables dinámicas (no build-time)
    Object.keys(import.meta.env).forEach((key) => {
      if (key.startsWith('VITE_')) {
        import.meta.env[key] = ''
      }
    })

    // Llama al logout del contexto
    logout?.()

    // Redirige al login
    nav('/login', { replace: true })
  }

  return (
    <nav>
  {/*
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {user ? (
          <>
            {user.fullName && <span>👋 {user.fullName}</span>}
            <button onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </>
        ) : (
          <button onClick={() => nav('/login', { replace: true })}>
            Iniciar Sesión
          </button>
        )}
      </div> */}
    </nav>

    
  )
}
