import { useNavigate } from 'react-router-dom';

export default function AdminNavBar() {
  const nav = useNavigate();
  function handleLogout() {
    localStorage.clear();
    nav('/', { replace:true });
  }
  return (
    <nav style={{ display:'flex', gap:12, alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #e5e7eb' }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <strong>MediTriage Admin</strong>
        <a href="/home/admin">Dashboard</a>
      </div>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <button onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
