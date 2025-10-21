// src/App.tsx
import React, { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import MainLayout2 from "./layouts/MainLayout";

// Páginas públicas / comunes
import Home from "./pages/Home";
import ConfirmacionCita from "./pages/ConfirmacionCita";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookAppointment from "./pages/BookAppointment";
import Triage from "./pages/Triage";
import Appointments from "./pages/Appointments";
import Doctor from "./pages/Doctor";
import NotFound from "./pages/NotFound";
import AgendarInvitado from "./pages/AgendarInvitado";

// Admin
import Admin from "./pages/Admin";              // Wrapper que renderiza AdminDashboard
import AdminTables from "./pages/AdminTables";  // Tu vista de pestañas/listados

// Secciones de administración existentes
import AdminDoctorsPage from "./pages/AdminDoctorsPage";
import AddDoctorPage from "./pages/AddDoctorPage";
import ListDoctorPage from "./pages/ListDoctorPage";
import DeleteDoctorPage from "./pages/DeleteDoctorPage";
import AssignDoctorPage from "./pages/AssignDoctorPage";
import SucursalPage from "./pages/SucursalPage";
import ListSucursalPage from "./pages/ListSucursalPage";
import AddSucursalPage from "./pages/AddSucursalPage";
import DeleteSucursalPage from "./pages/DeleteSucursalPage";

/* ----------------------------- UI helpers ------------------------------ */
function Loading() {
  return <div className="p-8 text-center">Cargando…</div>;
}

/* ----------------------------- Route Guards ---------------------------- */
function AdminOnlyGuard({ children }: { children: ReactNode }) {
  const { user, token, ready } = useAuth();

  // Esperar a que termine /auth/me (evita "Acceso denegado" prematuro)
  if (!ready) return <Loading />;

  // Si no hay sesión -> login
  if (!token) return <Navigate to="/login" replace />;

  // Si no es admin -> negar
  if (user?.role !== "admin") {
    return (
      <div className="p-8 text-center text-red-600">
        Acceso denegado. Solo administradores pueden ver esta página.
      </div>
    );
  }
  return <>{children}</>;
}

function DoctorOnlyGuard({ children }: { children: ReactNode }) {
  const { user, token, ready } = useAuth();

  if (!ready) return <Loading />;
  if (!token) return <Navigate to="/login" replace />;

  if (user?.role !== "doctor") {
    return (
      <div className="p-8 text-center text-red-600">
        Acceso denegado. Solo médicos pueden ver esta página.
      </div>
    );
  }
  return <>{children}</>;
}

/* --------------------------------- App ---------------------------------- */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Todo lo “normal” usa MainLayout2 (incluye Navbar + Container) */}
        <Route element={<MainLayout2 />}>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/agendar-invitado" element={<AgendarInvitado />} />
          <Route path="/confirmacion-cita" element={<ConfirmacionCita />} />
          <Route path="/book" element={<BookAppointment />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/appointments" element={<Appointments />} />

          {/* Compatibilidad: redirigir rutas viejas */}
          <Route path="/home/admin" element={<Navigate to="/admin" replace />} />
          <Route path="/home/doctor" element={<Navigate to="/doctor" replace />} />

          {/* Áreas protegidas */}
          <Route
            path="/doctor"
            element={
              <DoctorOnlyGuard>
                <Doctor />
              </DoctorOnlyGuard>
            }
          />

          {/* /admin ahora muestra el dashboard */}
          <Route
            path="/admin"
            element={
              <AdminOnlyGuard>
                <Admin /> {/* Admin renderiza AdminDashboard */}
              </AdminOnlyGuard>
            }
          />

          {/* Vista de pestañas/listados (tu AdminTables) */}
          <Route
            path="/admin/tables"
            element={
              <AdminOnlyGuard>
                <AdminTables />
              </AdminOnlyGuard>
            }
          />

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
      </Routes>
    </BrowserRouter>
  );
}
