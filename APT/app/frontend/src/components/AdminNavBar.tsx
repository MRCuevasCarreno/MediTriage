import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function AdminNavBar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    logout?.();
    nav('/login', { replace: true });
  }
  return (
    <nav>
    {/*  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <strong>MediTriage Admin</strong>
  <Link to="/home/admin">Dashboard</Link>
  <Link to="/admin/doctors">Doctores</Link>
  <Link to="/admin/sucursal">Sucursales</Link>
      </div>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        {user?.fullName && <span>👋 {user.fullName}</span>}
        <button onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>*/}
    </nav>
  );
}
