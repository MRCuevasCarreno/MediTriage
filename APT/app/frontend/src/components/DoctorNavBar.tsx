import { useNavigate } from 'react-router-dom';

export default function DoctorNavBar() {
  const nav = useNavigate();
  return (
    <nav style={{ display:'flex', gap:12, alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #e5e7eb' }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <strong>MediTriage Doctor</strong>
        <a href="/home/Doctor">Citas</a>
      </div>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <button onClick={()=> nav('/', { replace:true })}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
