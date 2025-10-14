import AdminNavBar from '../components/AdminNavBar';

export default function AdminHome() {
  return (
    <>
      <AdminNavBar />
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>
        <p className="mb-4">Bienvenido Administrador. Aquí puedes gestionar el sistema.</p>
        {/* Aquí puedes agregar más contenido para el admin */}
      </div>
    </>
  );
}
