// src/pages/Register.tsx
import React, { useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { post } from "../lib/api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient" as "patient" | "doctor" | "admin",
  });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { loginWithCredentials } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      // ✅ Backend correcto
      await post("/api/auth/register", {
        email: form.email,
        password: form.password,
        fullName: form.name, // backend mapea a User.Name
        role: form.role,
      });

      // Auto-login como ya tenías
      await loginWithCredentials(form.email, form.password);

      // 👇 Mensaje de bienvenida (puedes cambiar alert por tu Toast)
      const roleLabel =
        form.role === "admin" ? "Admin" : form.role === "doctor" ? "Médico" : "Paciente";
      alert(`¡Cuenta creada! Bienvenido/a, ${form.name} (${roleLabel}).`);

      nav("/");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "No se pudo registrar.";

      if (status === 409) {
        alert("Este correo ya está registrado. Te llevo a Iniciar sesión.");
        return nav("/login");
      }
      alert(msg);
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <Card title="Crear cuenta">
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm">Nombre</label>
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Jane Doe"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm">Email</label>
              <input
                type="email"
                className="w-full rounded-xl border px-3 py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="correo@dominio.com"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="text-sm">Rol</label>
              <select
                className="w-full rounded-xl border px-3 py-2"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
              >
                <option value="patient">Paciente</option>
                <option value="doctor">Médico</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-sm">Contraseña</label>
              <input
                type="password"
                className="w-full rounded-xl border px-3 py-2"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="col-span-2 flex justify-end">
              <button
                className="rounded-xl px-4 py-2 border disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
