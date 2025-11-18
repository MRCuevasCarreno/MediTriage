import { useEffect, useMemo, useState } from "react";
import { baseURL } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
// Container not required here; use main wrapper from layout

type Appointment = {
  id: number;
  patientId: number;
  patientName?: string;
  doctorId?: number;
  doctorName?: string;
  start: string;
  end?: string;
  triageLevel?: "LOW" | "MEDIUM" | "HIGH" | string;
  triageNotes?: string;
};

function mapPriority(level?: string) {
  if (!level) return "-";
  const v = String(level).toUpperCase();
  if (v === "HIGH") return "ALTO";
  if (v === "MEDIUM") return "MEDIO";
  if (v === "LOW") return "BAJO";
  return level;
}

function fmtDateTime(start: string) {
  try {
    const d = new Date(start);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min} hrs`;
  } catch {
    return start;
  }
}

export default function PatientAppointmentsPage() {
  const { token } = useAuth();
  const [patientId, setPatientId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filters / pagination
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number>(25); // 25 default, cap 50
  const [pagePending, setPagePending] = useState(1);
  const [pagePast, setPagePast] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function fetchPatient() {
      setLoading(true);
      setError("");
      try {
        if (!token) {
          setError("Token no disponible. Inicia sesión nuevamente.");
          return;
        }
        const res = await fetch(`${baseURL}/api/Patients/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json, text/plain, */*" },
        });
        if (!res.ok) throw new Error("No se pudo obtener patientId");
        const json = await res.json();
        const pid = json?.patientId ?? json?.data?.patientId ?? null;
        if (!cancelled) setPatientId(pid ? Number(pid) : null);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Tenemos problemas de conexión para cargar tus citas, intenta en otro momento.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPatient();
    return () => { cancelled = true };
  }, [token]);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    async function fetchAppointments() {
      setLoading(true);
      setError("");
      try {
        const headers: Record<string, string> = { Accept: "application/json, text/plain, */*" };
        if (token) headers.Authorization = `Bearer ${token}`;

        // Request a reasonably large page so we can paginate client-side per list.
        const fetchSize = 1000;
        const url = new URL(`${baseURL}/api/Appointments`);
        url.searchParams.set("patientId", String(patientId));
        url.searchParams.set("PageSize", String(fetchSize));
        url.searchParams.set("SortBy", "start");
        url.searchParams.set("SortDirection", sortDirection);
        if (dateFilter) url.searchParams.set("date", dateFilter);

        const res = await fetch(url.toString(), { headers });
        if (!res.ok) throw new Error("Error cargando citas");
        const json = await res.json();
        const list: Appointment[] = json?.data ?? [];
        if (!cancelled) setAppointments(list);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Tenemos problemas de conexión para cargar tus citas, intenta en otro momento.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAppointments();
    return () => { cancelled = true };
  }, [patientId, token, dateFilter, sortDirection]);

  const now = useMemo(() => new Date(), []);
  const pending = useMemo(() => appointments.filter(a => new Date(a.start) >= now), [appointments, now]);
  const past = useMemo(() => appointments.filter(a => new Date(a.start) < now), [appointments, now]);

  // pagination helpers
  const paginated = (list: Appointment[], page: number) => {
    const startIdx = (page - 1) * pageSize;
    return list.slice(startIdx, startIdx + pageSize);
  };

  const totalPagesPending = Math.max(1, Math.ceil(pending.length / pageSize));
  const totalPagesPast = Math.max(1, Math.ceil(past.length / pageSize));

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mis Citas</h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Filtrar por fecha</label>
          <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPagePending(1); setPagePast(1); }} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Orden</label>
          <select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)} className="border rounded px-2 py-1 w-full">
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Tamaño de página</label>
          <select value={pageSize} onChange={e => setPageSize(Math.min(50, Number(e.target.value)))} className="border rounded px-2 py-1 w-full">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading && <p>Cargando citas...</p>}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Citas Pendientes</h2>
        {pending.length === 0 ? (
          <p>Sin citas pendientes.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {paginated(pending, pagePending).map(a => (
                <li key={a.id} className="border rounded p-3">
                  <div className="font-semibold">Dr. {a.doctorName}</div>
                  <div>{fmtDateTime(a.start)}</div>
                  <div><strong>Prioridad:</strong> {mapPriority(a.triageLevel)}</div>
                  <div><strong>Notas:</strong> {a.triageNotes ?? '-'}</div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setPagePending(p => Math.max(1, p - 1))} className="px-3 py-1 rounded border">Anterior</button>
              <div>Pagina {pagePending} / {totalPagesPending}</div>
              <button onClick={() => setPagePending(p => Math.min(totalPagesPending, p + 1))} className="px-3 py-1 rounded border">Siguiente</button>
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Citas Anteriores</h2>
        {past.length === 0 ? (
          <p>Sin citas anteriores.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {paginated(past, pagePast).map(a => (
                <li key={a.id} className="border rounded p-3">
                  <div className="font-semibold">Dr. {a.doctorName}</div>
                  <div>{fmtDateTime(a.start)}</div>
                  <div><strong>Prioridad:</strong> {mapPriority(a.triageLevel)}</div>
                  <div><strong>Notas:</strong> {a.triageNotes ?? '-'}</div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setPagePast(p => Math.max(1, p - 1))} className="px-3 py-1 rounded border">Anterior</button>
              <div>Pagina {pagePast} / {totalPagesPast}</div>
              <button onClick={() => setPagePast(p => Math.min(totalPagesPast, p + 1))} className="px-3 py-1 rounded border">Siguiente</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
