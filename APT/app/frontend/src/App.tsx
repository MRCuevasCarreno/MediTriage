// Limpieza y estructura: solo router y helpers
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <BrowserRouter>
  <Routes>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
