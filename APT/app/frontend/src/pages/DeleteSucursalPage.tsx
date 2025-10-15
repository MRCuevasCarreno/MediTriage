import AdminNavBar from '../components/AdminNavBar';

export default function DeleteSucursalPage() {
  return (
    <>
      <AdminNavBar />
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Eliminar Sucursal</h1>
        <p className="mb-4">Selecciona una sucursal para eliminar (próximamente).</p>
      </div>
    </>
  );
}