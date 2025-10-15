import AdminNavBar from '../components/AdminNavBar';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

interface Doctor {
  id: number;
  userId: number;
  specialty: string;
  center: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  comuna: string;
  doctors: Doctor[];
}

export default function ListSucursalPage() {
  const { token } = useAuth();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSucursales() {
      try {
        const res = await fetch('https://localhost:7290/api/Sucursales', {
          headers: {
            'accept': 'text/plain',
            'Authorization': `Bearer ${token}`,
          },
        });
        const json = await res.json();
        setSucursales(json.data || []);
      } catch (err) {
        setError('Error al obtener sucursales');
      } finally {
        setLoading(false);
      }
    }
    fetchSucursales();
  }, [token]);

  return (
    <>
      <AdminNavBar />
      <div className="max-w-3xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Listar Sucursales</h1>
        {loading ? (
          <p>Cargando sucursales...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="space-y-6">
            {sucursales.map(sucursal => (
              <div key={sucursal.id} className="border rounded p-4 shadow">
                <div className="font-semibold text-lg mb-1">{sucursal.nombre}</div>
                <div className="mb-1">Dirección: {sucursal.direccion}</div>
                <div className="mb-2">Comuna: {sucursal.comuna}</div>
                <label className="block mb-1 font-medium">Doctores asociados:</label>
                <select className="w-full border rounded px-2 py-1">
                  {sucursal.doctors && sucursal.doctors.length > 0 ? (
                    sucursal.doctors.map(doc => (
                      <option key={doc.id}>
                        {doc.user?.name} - {doc.specialty} ({doc.center})
                      </option>
                    ))
                  ) : (
                    <option>Sin doctores asociados</option>
                  )}
                </select>
                <button className="mt-3 bg-red-600 text-white px-3 py-1 rounded opacity-60 cursor-not-allowed" disabled>Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}