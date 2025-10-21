import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import { get } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

type Appointment = {
  id?: number;
  start?: string;
  end?: string;
  status?: string;
  attended?: boolean;
  noShow?: boolean;
  triageLevel?: string | number;
  patientId?: number | string;
  doctorId?: number | string;
};

type Row = { id: number; name?: string; fullName?: string; [k: string]: any };

const StatCard = ({ label, value }: { label: string; value: number | null }) => (
  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="mt-2 text-4xl font-bold">{value ?? "—"}</p>
  </div>
);

export default function AdminDashboard() {
  const { logout } = useAuth();

  const [patients, setPatients] = useState<Row[]>([]);
  const [doctors, setDoctors] = useState<Row[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statsApi, setStatsApi] = useState<{
    patients?: number;
    doctors?: number;
    appointments?: number;
    noShows?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;

    async function load() {
      // 1) Si existe: /api/admin/stats
      try {
        const s = await get<any>("/api/admin/stats");
        if (!canceled && s) setStatsApi(s);
      } catch {
        /* ignorar si no existe */
      }

      // 2) Fallback: contar desde endpoints base
      const [p, d, a] = await Promise.allSettled([
        get<Row[]>("/api/patients"),
        get<Row[]>("/api/doctors"),
        get<Appointment[]>("/api/appointments"),
      ]);

      if (canceled) return;

      if (p.status === "fulfilled" && Array.isArray(p.value)) setPatients(p.value);
      if (d.status === "fulfilled" && Array.isArray(d.value)) setDoctors(d.value);
      if (a.status === "fulfilled" && Array.isArray(a.value)) setAppointments(a.value);

      setLoading(false);
    }

    load();
    return () => { canceled = true; };
  }, []);

  const noShowsFromAppointments = useMemo(() => {
    return appointments.filter((a: any) => {
      if (a?.noShow === true) return true;
      if (a?.attended === false) return true;
      if (typeof a?.status === "string" && a.status.toLowerCase().includes("no")) return true; // "no-show", "no asistió"
      return false;
    }).length;
  }, [appointments]);

  const patientsCount     = statsApi?.patients     ?? (patients.length || null);
  const doctorsCount      = statsApi?.doctors      ?? (doctors.length || null);
  const appointmentsCount = statsApi?.appointments ?? (appointments.length || null);
  const noShowsCount      = statsApi?.noShows      ?? (appointments.length ? noShowsFromAppointments : null);

  return (
    <Layout>
      {/* Header como en tu captura */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MediTriage</h1>
          <div className="text-sm text-gray-500">Inicio</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-yellow-800 border border-yellow-200 text-sm">
            🛡️ Admin
          </span>
          <button onClick={logout} className="text-sm text-gray-700 hover:underline">
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pacientes" value={loading ? null : patientsCount} />
        <StatCard label="Médicos"   value={loading ? null : doctorsCount} />
        <StatCard label="Citas"     value={loading ? null : appointmentsCount} />
        <StatCard label="No-shows"  value={loading ? null : noShowsCount} />
      </div>

      {/* Operaciones + Alertas */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Operaciones"
          actions={<button className="rounded-xl px-3 py-1.5 border hover:bg-gray-50">Exportar</button>}
        >
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><Link to="/admin/doctors" className="text-blue-600 hover:underline">Configurar especialidades / Doctores</Link></li>
            <li><Link to="/admin/assign/doctor" className="text-blue-600 hover:underline">Asignar agenda a médicos</Link></li>
            <li><Link to="/admin/sucursal" className="text-blue-600 hover:underline">Sucursales</Link></li>
            <li><Link to="/admin/list/doctor" className="text-blue-600 hover:underline">Revisar reportes de doctores</Link></li>
          </ul>

          {/* Enlace a tu vista de listados */}
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
