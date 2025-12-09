// src/components/AdminNavBar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

type AdminNavBarProps = {

  active?: "dashboard" | "doctors" | "sucursales" | "patients";
};

export default function AdminNavBar({ active }: AdminNavBarProps) {
  const location = useLocation();

  const tabs = [
    { key: "dashboard", label: "Dashboard", to: "/admin" },
    { key: "doctors", label: "Doctores", to: "/admin/doctors" },
    // este va a tu /admin/tables donde ya muestras pacientes
    { key: "patients", label: "Pacientes", to: "/admin/tables" },
    { key: "sucursales", label: "Sucursales", to: "/admin/sucursal" },
  ];

  return (
    <nav className="sticky top-[64px] z-30 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* título chiquito */}
        <span className="text-sm font-semibold text-slate-700">
          MediTriages · Administrador
        </span>

        {/* pestañas */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const isActive =
              active === tab.key || location.pathname === tab.to;
            return (
              <Link
                key={tab.key}
                to={tab.to}
                className={
                  "px-3 py-1.5 rounded-full text-sm font-medium transition " +
                  (isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100")
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
