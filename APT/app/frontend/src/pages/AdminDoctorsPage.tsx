import AdminNavBar from '../components/AdminNavBar';
import { Link } from 'react-router-dom';

export default function AdminDoctorsPage() {
  return (
    <>
      <AdminNavBar />
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Administrar Doctores</h1>
        <div className="flex flex-col gap-4 mb-4">
          <Link to="/admin/add/doctor" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center">Nuevo Doctor</Link>
          <Link to="/admin/list/doctor" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center">Administrar Doctores</Link>
        </div>
        <p className="mb-4">Selecciona una acción para gestionar doctores.</p>
      </div>
    </>
  );
}
