import { useEffect, useMemo, useState } from "react";
import { get } from "../lib/api";
import type { Appointment } from "../types";

export default function MyAppointmentsPage() {
  const [list, setList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    get<Appointment[]>("/api/appointments")
      .then(r => setList(r as any))
      .finally(()=>setLoading(false));
  }, []);

  const filtered = useMemo(()=>{
    if (!q) return list;
    return list.filter(a => (a.triageNotes ?? "").toLowerCase().includes(q.toLowerCase()));
  }, [list, q]);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mis citas</h1>
      <div className="mb-4">
        <input className="border rounded p-2 w-full" placeholder="Buscar por notas..." value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      {loading ? <p>Cargando...</p> : (
        <ul className="space-y-3">
          {filtered.map(a => (
            <li key={a.id} className="border rounded p-3">
              <div><b>ID:</b> {a.id}</div>
              <div><b>Paciente:</b> {a.patientId} — <b>Médico:</b> {a.doctorId}</div>
              <div><b>Inicio:</b> {new Date(a.start).toLocaleString()} — <b>Fin:</b> {new Date(a.end).toLocaleString()}</div>
              <div><b>Triage:</b> {a.triageLevel ?? "-"}</div>
              <div><b>Notas:</b> {a.triageNotes ?? "-"}</div>
            </li>
          ))}
          {filtered.length === 0 && <p>Sin resultados.</p>}
        </ul>
      )}
    </main>
  );
}
