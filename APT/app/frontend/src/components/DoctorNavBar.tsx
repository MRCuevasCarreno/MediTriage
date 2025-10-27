import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function DoctorNavBar() {
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
      {/*
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <strong>MediTriage Doctor</strong>
        <a href="/home/Doctor">Citas</a>
      </div>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        {user?.fullName && <span>👋 {user.fullName}</span>}
        <button onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div> */}
    </nav>
  );
}
