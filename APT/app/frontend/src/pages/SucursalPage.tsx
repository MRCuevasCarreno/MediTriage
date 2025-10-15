import AdminNavBar from '../components/AdminNavBar';
import { Link } from 'react-router-dom';

export default function SucursalPage() {
  return (
    <>
      <AdminNavBar />
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Gestión de Sucursales</h1>
        <div className="flex flex-col gap-4 mb-4">
          <Link to="/admin/list/sucursal" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center">Listar Sucursales</Link>
          <Link to="/admin/add/sucursal" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center">Agregar Sucursal</Link>
          <Link to="/admin/delete/sucursal" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-center">Eliminar Sucursal</Link>
        </div>
        <p className="mb-4">Selecciona una acción para gestionar sucursales.</p>
      </div>
    </>
  );
}