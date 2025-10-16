import AdminNavBar from '../components/AdminNavBar';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

interface Doctor {
  id: number;
  userId: number;
  name: string;
  specialty: string;
  email: string;
}

export default function ListDoctorPage() {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<'Asc'|'Desc'>('Asc');
  const [sortField, setSortField] = useState<'name'|'specialty'|'email'>('name');
  const [totalPages, setTotalPages] = useState(1);
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      setError('');
      try {
        const params = [
          `PageNumber=${pageNumber}`,
          `PageSize=${pageSize}`,
          `SortBy=${sortField}`,
          `SortDirection=${sortBy}`,
        ];
        if (searchName.trim()) {
          params.push(`name=${encodeURIComponent(searchName.trim())}`);
        }
        const url = `https://localhost:7290/api/Doctors?${params.join('&')}`;
        const res = await fetch(url, {
          headers: {
            'Accept': 'text/plain',
            'Authorization': `Bearer ${token}`,
          },
        });
        const json = await res.json();
        setDoctors(json.data?.data || []);
        setTotalPages(json.data?.totalPages || 1);
      } catch (err) {
        setError('Error al obtener doctores');
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, [pageNumber, pageSize, sortBy, sortField, searchName, token]);

  return (
    <>
      <AdminNavBar />
      <div className="max-w-3xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Listar Doctores</h1>
        <div className="flex gap-4 mb-6 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Buscar por nombre:</label>
            <input
              type="text"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="Nombre del doctor"
              className="border rounded px-2 py-1 w-48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ordenar por:</label>
            <select value={sortField} onChange={e => setSortField(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="name">Nombre</option>
              <option value="specialty">Especialidad</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dirección de orden:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="Asc">Ascendente</option>
              <option value="Desc">Descendente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tamaño de página:</label>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1">
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <p>Cargando doctores...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="space-y-4">
            {doctors.map(doc => (
              <div key={doc.id} className="border rounded p-4 shadow">
                <div className="font-semibold text-lg mb-1">{doc.name}</div>
                <div className="mb-1">Especialidad: {doc.specialty}</div>
                <div className="mb-1">Email: {doc.email}</div>
              </div>
            ))}
          </div>
        )}
        {/* Paginación */}
        <div className="flex gap-2 mt-8 justify-center items-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setPageNumber(page)}
              className={`px-3 py-1 rounded border ${pageNumber === page ? 'bg-blue-600 text-white font-bold' : 'bg-gray-100 text-gray-700'}`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
