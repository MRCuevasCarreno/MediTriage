import React, { useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "patient" as "patient" | "doctor" | "admin" });
  const nav = useNavigate();
  const { loginWithCredentials } = useAuth();
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Aquí deberías llamar a tu API de registro y luego loguear al usuario
    await loginWithCredentials(form.email, form.password);
    nav("/");
  }
  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <Card title="Crear cuenta">
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm">Nombre</label>
              <input className="w-full rounded-xl border px-3 py-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm">Email</label>
              <input className="w-full rounded-xl border px-3 py-2" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Rol</label>
              <select className="w-full rounded-xl border px-3 py-2" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}>
                <option value="patient">Paciente</option>
                <option value="doctor">Médico</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Contraseña</label>
              <input type="password" className="w-full rounded-xl border px-3 py-2" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="col-span-2 flex justify-end">
              <button className="rounded-xl px-4 py-2 border">Crear</button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
