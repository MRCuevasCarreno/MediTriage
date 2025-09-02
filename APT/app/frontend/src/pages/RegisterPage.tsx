import { useState } from "react";
import { post } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      // Backend mapea fullName -> User.Name (según tu nota previa)
      await post("/api/auth/register", form);
      alert("Registro exitoso, ahora inicia sesión.");
      nav("/login");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "No se pudo registrar");
    } finally { setLoading(false); }
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Crear cuenta</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="border rounded p-2 w-full" placeholder="Nombre completo"
          value={form.fullName} onChange={e=>setForm(f=>({...f, fullName: e.target.value}))} required />
        <input className="border rounded p-2 w-full" placeholder="Email" type="email"
          value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))} required />
        <input className="border rounded p-2 w-full" placeholder="Contraseña" type="password"
          value={form.password} onChange={e=>setForm(f=>({...f, password: e.target.value}))} required />
        <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60" disabled={loading}>
          {loading ? "Creando..." : "Registrarme"}
        </button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
      <p className="mt-4 text-sm">¿Ya tienes cuenta? <Link to="/login" className="text-blue-500 underline">Inicia sesión</Link></p>
    </main>
  );
}
