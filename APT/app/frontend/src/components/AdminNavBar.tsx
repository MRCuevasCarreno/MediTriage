import { useNavigate } from 'react-router-dom';
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
    <nav style={{ display:'flex', gap:12, alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #e5e7eb' }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <strong>MediTriage Admin</strong>
        <a href="/home/admin">Dashboard</a>
      </div>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        {user?.fullName && <span>👋 {user.fullName}</span>}
        <button onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
