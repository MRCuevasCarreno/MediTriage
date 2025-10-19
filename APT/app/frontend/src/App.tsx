// src/App.tsx
import React, { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import MainLayout2 from "./layouts/MainLayout";

// Páginas
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
import AdminHome from "./pages/AdminHome";

import AdminDoctorsPage from "./pages/AdminDoctorsPage";
import AddDoctorPage from "./pages/AddDoctorPage";
import ListDoctorPage from "./pages/ListDoctorPage";
import DeleteDoctorPage from "./pages/DeleteDoctorPage";
import AssignDoctorPage from "./pages/AssignDoctorPage";
import SucursalPage from "./pages/SucursalPage";
import ListSucursalPage from "./pages/ListSucursalPage";
import AddSucursalPage from "./pages/AddSucursalPage";
import DeleteSucursalPage from "./pages/DeleteSucursalPage";

function AdminOnlyGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "Admin") {
    return (
      <div className="p-8 text-center text-red-600">
        Acceso denegado. Solo administradores pueden ver esta página.
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Todo lo “normal” usa MainLayout2 (incluye Navbar + Container) */}
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

          {/* Secciones de administración */}
          <Route path="/admin/doctors" element={<AdminOnlyGuard><AdminDoctorsPage /></AdminOnlyGuard>} />
          <Route path="/admin/add/doctor" element={<AdminOnlyGuard><AddDoctorPage /></AdminOnlyGuard>} />
          <Route path="/admin/list/doctor" element={<AdminOnlyGuard><ListDoctorPage /></AdminOnlyGuard>} />
          <Route path="/admin/delete/doctor" element={<AdminOnlyGuard><DeleteDoctorPage /></AdminOnlyGuard>} />
          <Route path="/admin/assign/doctor" element={<AdminOnlyGuard><AssignDoctorPage /></AdminOnlyGuard>} />
          <Route path="/admin/sucursal" element={<AdminOnlyGuard><SucursalPage /></AdminOnlyGuard>} />
          <Route path="/admin/list/sucursal" element={<AdminOnlyGuard><ListSucursalPage /></AdminOnlyGuard>} />
          <Route path="/admin/add/sucursal" element={<AdminOnlyGuard><AddSucursalPage /></AdminOnlyGuard>} />
          <Route path="/admin/delete/sucursal" element={<AdminOnlyGuard><DeleteSucursalPage /></AdminOnlyGuard>} />

          {/* 404 dentro del layout */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Sólo si de verdad quieres páginas SIN el layout principal */}
        <Route path="/home/Doctor" element={<DoctorHome />} />
        <Route path="/home/admin" element={<AdminHome />} />
      </Routes>
    </BrowserRouter>
  );
}
