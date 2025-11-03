// src/components/UserChip.tsx
import React from "react";
import { useAuth, type Role } from "../auth/AuthContext";

const roleLabel: Record<Role, string> = {
  admin: "Admin",
  doctor: "Médico",
  patient: "Paciente",
};

export default function UserChip() {
  const { user } = useAuth();
  if (!user) return null;

  const name = user.fullName ?? user.email ?? "Usuario";
  const role = (user.role ?? "patient") as Role;

  // Iniciales (máx. 2)
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
        {initials}
      </div>
      <div className="leading-tight">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-gray-500">{roleLabel[role]}</div>
      </div>
    </div>
  );
}
