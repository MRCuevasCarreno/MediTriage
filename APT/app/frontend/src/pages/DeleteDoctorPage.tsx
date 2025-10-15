import AdminNavBar from '../components/AdminNavBar';

export default function DeleteDoctorPage() {
  return (
    <>
      <AdminNavBar />
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Eliminar Doctor</h1>
        <p className="mb-4">Selecciona un doctor para eliminar (próximamente).</p>
      </div>
    </>
  );
}