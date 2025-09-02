import { useEffect, useMemo, useState } from "react";
import { get } from "../lib/api";
import type { Appointment } from "../types";

type View = "day" | "week" | "month";

export default function DoctorAppointmentsPage() {
  const [list, setList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("day");
  const [refDate, setRefDate] = useState<string>(() => new Date().toISOString().slice(0,10));

  useEffect(() => {
    setLoading(true);
    get<Appointment[]>("/api/appointments")
      .then(r => setList(r as any))
      .finally(()=>setLoading(false));
  }, []);

  const range = useMemo(() => {
    const d = new Date(refDate + "T00:00");
    const start = new Date(d);
    const end = new Date(d);
    if (view === "day") {
      end.setDate(end.getDate() + 1);
    } else if (view === "week") {
      const wd = d.getDay(); // 0..6
      start.setDate(d.getDate() - wd);
      end.setDate(start.getDate() + 7);
    } else {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1); end.setDate(1);
    }
    return { start, end };
  }, [view, refDate]);

  const filtered = useMemo(() => {
    return list.filter(a => {
      const s = new Date(a.start);
      return s >= range.start && s < range.end;
    });
  }, [list, range]);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Citas del doctor</h1>
      <div className="flex gap-3 mb-4 items-center">
        <select className="border rounded p-2" value={view} onChange={e=>setView(e.target.value as View)}>
          <option value="day">Día</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
        </select>
        <input type="date" className="border rounded p-2" value={refDate} onChange={e=>setRefDate(e.target.value)} />
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
          {filtered.length === 0 && <p>Sin resultados en el rango seleccionado.</p>}
        </ul>
      )}
    </main>
  );
}
