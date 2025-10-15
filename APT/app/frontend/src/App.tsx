import AdminHome from "./pages/AdminHome";
import AdminDoctorsPage from "./pages/AdminDoctorsPage";
import { useAuth } from "./auth/AuthContext";

export function AdminDoctorsPageGuard() {
  const { user } = useAuth();
  if (user?.role !== "Admin") {
    return <div className="p-8 text-center text-red-600">Acceso denegado. Solo administradores pueden ver esta página.</div>;
  }
  return <AdminDoctorsPage />;
}
// Limpieza y estructura: solo router y helpers
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout2 from "./layouts/MainLayout";
import Home from "./pages/Home";
import ConfirmacionCita from "./pages/ConfirmacionCita";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookAppointment from "./pages/BookAppointment";
import Triage from "./pages/Triage";
import Appointments from "./pages/Appointments";
import Doctor from "./pages/Doctor";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import AgendarInvitado from "./pages/AgendarInvitado";
import DoctorHome from "./pages/DoctorHome";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas con layout general */}
        <Route element={<MainLayout2 />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/agendar-invitado" element={<AgendarInvitado />} />
          <Route path="/confirmacion-cita" element={<ConfirmacionCita />} />
          <Route path="/book" element={<BookAppointment />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/doctors" element={<AdminDoctorsPageGuard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        {/* Rutas con layout personalizado (sin MainLayout2) */}
        <Route path="/home/Doctor" element={<DoctorHome />} />
        <Route path="/home/admin" element={<AdminHome />} />
      </Routes>
    </BrowserRouter>
  );
}
