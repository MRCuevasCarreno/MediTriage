import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import { get } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

type Stats = { patients: number; doctors: number; appointments: number; noShows: number; };

const Stat = ({ label, value }: { label: string; value: number | null }) => (
  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="mt-2 text-4xl font-bold">{value ?? "—"}</p>
  </div>
);

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        // <<< SIN /api
        const s = await get<Stats>("/admin/stats");
        if (!canceled) { setStats(s); setLoading(false); }
      } catch (e: any) {
        if (!canceled) {
          setError(e?.response?.data?.message ?? "No se pudieron cargar las métricas.");
          setLoading(false);
        }
      }
    })();
    return () => { canceled = true; };
  }, []);

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MediTriage</h1>
          <div className="text-sm text-gray-500">Inicio</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-yellow-800 border border-yellow-200 text-sm">
            🛡️ Admin
          </span>
          <button onClick={logout} className="text-sm text-gray-700 hover:underline">Cerrar Sesión</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Pacientes" value={loading ? null : stats?.patients ?? null} />
        <Stat label="Médicos"   value={loading ? null : stats?.doctors ?? null} />
        <Stat label="Citas"     value={loading ? null : stats?.appointments ?? null} />
        <Stat label="No-shows"  value={loading ? null : stats?.noShows ?? null} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Operaciones" actions={<button className="rounded-xl px-3 py-1.5 border hover:bg-gray-50">Exportar</button>}>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><Link to="/admin/doctors" className="text-blue-600 hover:underline">Configurar especialidades / Doctores</Link></li>
            <li><Link to="/admin/assign/doctor" className="text-blue-600 hover:underline">Asignar agenda a médicos</Link></li>
            <li><Link to="/admin/sucursal" className="text-blue-600 hover:underline">Sucursales</Link></li>
            <li><Link to="/admin/list/doctor" className="text-blue-600 hover:underline">Revisar reportes de doctores</Link></li>
          </ul>
          <div className="mt-6">
            <Link to="/admin/tables" className="inline-block rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
              Ver listados
            </Link>
          </div>
        </Card>

        <Card title="Alertas">
          <p className="text-sm text-gray-600">{loading ? "Cargando…" : "Sin alertas por ahora."}</p>
        </Card>
      </div>

      <div className="mt-8 border-t pt-4 text-xs text-gray-500">
        © {new Date().getFullYear()} MediTriage
      </div>
    </Layout>
  );
}
