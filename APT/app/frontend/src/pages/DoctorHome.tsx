import DoctorNavBar from '../components/DoctorNavBar';

export default function DoctorHome() {
  return (
    <>
      <DoctorNavBar />
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Bienvenido Doctor</h1>
        <p className="mb-4">Aquí puedes gestionar tus citas y ver tu agenda.</p>
        {/* Aquí puedes agregar más contenido para el doctor */}
      </div>
    </>
  );
}
