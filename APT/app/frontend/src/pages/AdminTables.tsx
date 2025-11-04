// src/pages/AdminTables.tsx
import React, { useEffect, useMemo, useState } from "react";
import { get } from "../lib/api";
import AdminNavBar from "../components/AdminNavBar";

type PatientRow = {
  id: number;
  name?: string;
  fullName?: string;
  email?: string;
  [k: string]: any;
};

type DoctorRow = {
  id: number;
  name?: string;
  specialty?: string;
  email?: string;
  [k: string]: any;
};

type AppointmentRow = {
  id: number;
  patientId?: number;
  doctorId?: number;
  start?: string;
  end?: string;
  triageLevel?: string;
  [k: string]: any;
};

function usePager<T>(data: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const maxPage = Math.max(1, Math.ceil(data.length / pageSize));
  const view = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize]
  );
  return { page, setPage, maxPage, view };
}

// normaliza las respuestas del backend
function normalizeArray<T = any>(resp: any): T[] {
  if (!resp) return [];
  // caso paginado típico: { data: { data: [...] } }
  if (resp.data && Array.isArray(resp.data.data)) return resp.data.data;
  // caso: { data: [...] }
  if (Array.isArray(resp.data)) return resp.data;
  // caso: [...]
  if (Array.isArray(resp)) return resp;
  // caso: { items: [...] }
  if (Array.isArray(resp.items)) return resp.items;
  return [];
}

export default function AdminTables() {
  const [tab, setTab] = useState<"patients" | "doctors" | "appointments">(
    "appointments"
  );
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // PACIENTES
    get<any>("/api/Patients")
      .then((r) => {
        const raw = normalizeArray<any>(r);
        const mapped: PatientRow[] = raw.map((x: any) => {
          const email =
            x.email ||
            x.mail ||
            x.correo ||
            x.user?.email ||
            x.contact?.email ||
            "";
          return {
            id: x.id,
            name: x.name,
            fullName: x.fullName,
            email,
            ...x,
          };
        });
        setPatients(mapped);
      })
      .catch(() => {
        // si falla mantenemos vacío
      });

    // DOCTORES
    get<any>("/api/Doctors")
      .then((r) => {
        const raw = normalizeArray<any>(r);
        const mapped: DoctorRow[] = raw.map((x: any) => ({
          id: x.id,
          name: x.name || x.fullName || x.user?.name,
          specialty: x.specialty,
          email: x.email || x.user?.email,
          ...x,
        }));
        setDoctors(mapped);
      })
      .catch(() => {
        // ignore
      });

    // CITAS
    get<any>("/api/Appointments")
      .then((r) => {
        const raw = normalizeArray<any>(r);
        const mapped: AppointmentRow[] = raw.map((x: any) => ({
          id: x.id,
          patientId: x.patientId,
          doctorId: x.doctorId,
          start: x.start,
          end: x.end,
          triageLevel: x.triageLevel,
          ...x,
        }));
        setAppointments(mapped);
      })
      .catch(() => {
        setError("No se pudieron cargar las citas.");
      });
  }, []);

  const lowerQ = q.toLowerCase();
  const filterAny = <T extends object>(rows: T[]) =>
    rows.filter((r) => JSON.stringify(r).toLowerCase().includes(lowerQ));

  const pPager = usePager(filterAny(patients));
  const dPager = usePager(filterAny(doctors));
  const aPager = usePager(filterAny(appointments));

  return (
    <>
      {/* barra admin arriba */}
      <AdminNavBar active="tables" />

      {/* mismo contenedor que el resto */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold mb-4">Panel administrador</h1>

        {error && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 px-4 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4 items-center">
          <button
            className={
              "px-3 py-1 rounded " +
              (tab === "appointments"
                ? "bg-blue-600 text-white"
                : "border border-gray-200")
            }
            onClick={() => setTab("appointments")}
          >
            Citas
          </button>
          <button
            className={
              "px-3 py-1 rounded " +
              (tab === "patients"
                ? "bg-blue-600 text-white"
                : "border border-gray-200")
            }
            onClick={() => setTab("patients")}
          >
            Pacientes
          </button>
          <button
            className={
              "px-3 py-1 rounded " +
              (tab === "doctors"
                ? "bg-blue-600 text-white"
                : "border border-gray-200")
            }
            onClick={() => setTab("doctors")}
          >
            Doctores
          </button>
          <input
            className="ml-auto border rounded p-2 text-sm"
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {tab === "patients" && (
          <section>
            <table className="w-full border rounded bg-white">
              <thead>
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {pPager.view.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.id}</td>
                    <td className="p-2">
                      {p.fullName || p.name || (p as any).nombre || "-"}
                    </td>
                    <td className="p-2">
                      {p.email && p.email !== "" ? p.email : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager {...pPager} />
          </section>
        )}

        {tab === "doctors" && (
          <section>
            <table className="w-full border rounded bg-white text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Especialidad</th>
                  <th className="text-left p-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {dPager.view.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-2">{d.id}</td>
                    <td className="p-2">
                      {d.name || d.fullName || (d as any).nombre || "-"}
                    </td>
                    <td className="p-2">{d.specialty || "-"}</td>
                    <td className="p-2">{d.email || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager {...dPager} />
          </section>
        )}

        {tab === "appointments" && (
          <section>
            <table className="w-full border rounded bg-white text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Paciente</th>
                  <th className="text-left p-2">Doctor</th>
                  <th className="text-left p-2">Inicio</th>
                  <th className="text-left p-2">Fin</th>
                  <th className="text-left p-2">Triage</th>
                </tr>
              </thead>
              <tbody>
                {aPager.view.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-2">{a.id}</td>
                    <td className="p-2">{a.patientId ?? "-"}</td>
                    <td className="p-2">{a.doctorId ?? "-"}</td>
                    <td className="p-2">
                      {a.start ? new Date(a.start).toLocaleString() : "-"}
                    </td>
                    <td className="p-2">
                      {a.end ? new Date(a.end).toLocaleString() : "-"}
                    </td>
                    <td className="p-2">{a.triageLevel ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager {...aPager} />
          </section>
        )}
      </main>
    </>
  );
}

function Pager({
  page,
  setPage,
  maxPage,
}: {
  page: number;
  setPage: (n: number) => void;
  maxPage: number;
}) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        className="border rounded px-3 py-1"
        onClick={() => setPage(Math.max(1, page - 1))}
      >
        Anterior
      </button>
      <span className="text-sm">
        Página {page} / {maxPage}
      </span>
      <button
        className="border rounded px-3 py-1"
        onClick={() => setPage(Math.min(maxPage, page + 1))}
      >
        Siguiente
      </button>
    </div>
  );
}
