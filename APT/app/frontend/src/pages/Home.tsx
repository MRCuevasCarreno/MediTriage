import React from "react";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";

export default function Home() {
  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Agenda con orientación inteligente
        </h1>
        <p className="text-gray-600 max-w-prose">
          Reserva tu cita y recibe una orientación previa mediante un triage básico
          impulsado por IA y reglas clínicas.
        </p>
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          <Link to="/agendar-invitado" className="rounded-xl px-4 py-2 border">Agendar</Link>
          <Link to="/triage" className="rounded-xl px-4 py-2 border">Probar Triage</Link>
        </div>
      </div>

      <Card title="Resumen rápido">
        <ul className="space-y-2 text-sm">
          <li>✔ Registro y autenticación</li>
          <li>✔ Triage orientativo con banderas rojas</li>
          <li>✔ Panel de médico y administración</li>
        </ul>
      </Card>
    </div>
  );
}
