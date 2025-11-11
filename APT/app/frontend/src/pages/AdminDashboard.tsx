// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import { get } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import AdminNavBar from "../components/AdminNavBar";

type Stats = {
  patients: number;
  doctors: number;
  appointments: number;
  noShows: number;
};

const Stat = ({ label, value, color, icon }: { label: string; value: number | null; color?: string; icon?: React.ReactNode }) => (
  <div className={`rounded-2xl p-6 shadow-sm border ${color ?? 'border-gray-100'} bg-white`}>
    <div className="flex items-center gap-3">
      <div className="text-2xl">{icon ?? null}</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="mt-2 text-4xl font-bold">{value ?? "—"}</p>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [cacheTs, setCacheTs] = useState<number | null>(null);

  // para “normalizar” respuestas distintas del backend
  function extractCount(resp: any): number {
    if (!resp) return 0;

    // { data: [...] }
    if (Array.isArray(resp.data)) return resp.data.length;

    // { data: { data: [...] , total? } }
    if (resp.data && Array.isArray(resp.data.data)) {
      if (typeof resp.data.total === "number") return resp.data.total;
      return resp.data.data.length;
    }

    // { items: [...] }
    if (Array.isArray(resp.items)) return resp.items.length;

    // { total: 123 }
    if (typeof resp.total === "number") return resp.total;

    return 0;
  }

  useEffect(() => {
    let canceled = false;

    const CACHE_KEY = "admin_stats";
    const TTL = 5 * 60 * 1000; // 5 minutos

    (async () => {
      try {
        // intentar usar cache salvo que se fuerce refresh
        if (!forceRefresh) {
          try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.stats && parsed.ts && Date.now() - parsed.ts < TTL) {
                if (!canceled) {
                  setStats(parsed.stats as Stats);
                  setCacheTs(parsed.ts);
                  setLoading(false);
                  return; // usar cache y no refetch
                }
              }
            }
          } catch (e) {
            // ignore cache parse errors
          }
        }

        // este /api/... ya pasa por tu túnel/ngrok
        const [docs, pats, apps] = await Promise.all([
          get<any>("/api/Doctors", { PageNumber: 1, PageSize: 50 }),
          get<any>("/api/Patients", { PageNumber: 1, PageSize: 50 }),
          get<any>("/api/Appointments", { PageNumber: 1, PageSize: 50 }),
        ]);

        const s: Stats = {
          doctors: extractCount(docs),
          patients: extractCount(pats),
          appointments: extractCount(apps),
          noShows: 0, // de momento
        };

        if (!canceled) {
          setStats(s);
          setLoading(false);
          try {
            const now = Date.now();
            localStorage.setItem(CACHE_KEY, JSON.stringify({ stats: s, ts: now }));
            setCacheTs(now);
          } catch (e) {}
        }
      } catch (e: any) {
        if (!canceled) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "No se pudieron cargar las métricas."
          );
          setLoading(false);
        }
      } finally {
        // reset forceRefresh flag after attempt
        if (!canceled) setForceRefresh(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [forceRefresh]);

  return (
    <>
      {/* barra de admin que tú activaste */}
      <AdminNavBar active="dashboard" />

      {/* mismo padding que /admin/doctors y /admin/sucursal */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            <div className="font-medium">Error cargando métricas</div>
            <div className="mt-1 text-sm">{error}</div>
            <div className="mt-3 flex items-center gap-4">
              <button
                className="rounded-xl px-3 py-1.5 border bg-white hover:bg-gray-50"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  setStats(null);
                  setForceRefresh(true); // forzar bypass cache y re-fetch
                }}
              >
                Reintentar
              </button>
              {/* Mostrar info de cache si existe */}
              {cacheTs && !loading && (
                <div className="text-sm text-gray-500">{(() => {
                  const diff = Math.floor((Date.now() - cacheTs) / 1000);
                  if (diff < 60) return `datos desde cache (hace ${diff}s)`;
                  if (diff < 3600) return `datos desde cache (hace ${Math.floor(diff / 60)}m)`;
                  return `datos desde cache (hace ${Math.floor(diff / 3600)}h)`;
                })()}</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Stat
            label="Pacientes"
            value={loading ? null : stats?.patients ?? null}
            color="border-blue-100"
            icon={<span className="text-blue-500">👥</span>}
          />
          <Stat
            label="Médicos"
            value={loading ? null : stats?.doctors ?? null}
            color="border-green-100"
            icon={<span className="text-green-500">🩺</span>}
          />
          <Stat
            label="Citas"
            value={loading ? null : stats?.appointments ?? null}
            color="border-purple-100"
            icon={<span className="text-purple-500">📅</span>}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Operaciones">
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <Link
                  to="/admin/doctors"
                  className="text-blue-600 hover:underline"
                >
                  Configurar especialidades / Doctores
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/assign/doctor"
                  className="text-blue-600 hover:underline"
                >
                  Asignar agenda a médicos
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/sucursal"
                  className="text-blue-600 hover:underline"
                >
                  Sucursales
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/list/doctor"
                  className="text-blue-600 hover:underline"
                >
                  Revisar reportes de doctores
                </Link>
              </li>
            </ul>
            <div className="mt-6">
              <Link
                to="/admin/tables"
                className="inline-block rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Ver listados
              </Link>
            </div>
          </Card>

          <Card title="Alertas">
            <p className="text-sm text-gray-600">
              {loading ? "Cargando…" : "Sin alertas por ahora."}
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
