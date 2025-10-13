import React from "react";
import { formatRut } from "../Utils/rut";
import { useLocation } from "react-router-dom";

export default function ConfirmacionCita({ location }: { location?: any }) {
  // Obtener datos de la cita desde useLocation o window
  const loc = useLocation();
  const data = loc.state?.data || (window as any).confirmacionCitaData || {};
  const especialidades = {
    "med-gen": "Medicina General",
    "derm": "Dermatología",
    "cardio": "Cardiología",
    "pedi": "Pediatría",
    "kine": "Kinesiología",
    "tele": "Telemedicina"
  };
  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl border bg-white mt-8">
      <h2 className="text-xl font-semibold mb-4">Reserva confirmada</h2>
      <ul className="text-sm space-y-2 mb-6">
        <li><b>RUT:</b> {data.rut ? formatRut(data.rut) : "—"}</li>
  <li><b>Especialidad:</b> {especialidades[String(data.servicioId) as keyof typeof especialidades] || "—"}</li>
        <li><b>Centro:</b> {data.centroNombre || data.centroId || "—"}</li>
        <li><b>Profesional:</b> {data.profesionalNombre || data.profesionalId || "—"}</li>
        <li><b>Fecha y hora inicio:</b> {data.start || "—"}</li>
        <li><b>Fecha y hora fin:</b> {data.end || "—"}</li>
        <li><b>Email:</b> {data.email || "—"}</li>
      </ul>
      <div className="text-green-700 font-semibold">¡Tu reserva ha sido confirmada!</div>
    </div>
  );
}
