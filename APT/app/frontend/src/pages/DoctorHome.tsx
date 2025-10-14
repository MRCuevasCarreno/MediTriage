import DoctorNavBar from '../components/DoctorNavBar';
import { DoctorCalendar } from '../components/DoctorCalendar';
import { useAuth } from '../auth/AuthContext';

export default function DoctorHome() {
  const { user } = useAuth();
  // Ahora el id del doctor para el API es user.doctorId
  const doctorId = user?.doctorId ? Number(user.doctorId) : 0;
  return (
    <>
      <DoctorNavBar />
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Bienvenido Doctor</h1>
        <p className="mb-4">Aquí puedes gestionar tus citas y ver tu agenda.</p>
        <DoctorCalendar doctorId={doctorId} />
      </div>
    </>
  );
}
