import { useEffect, useState } from "react";
import { get, post } from "./lib/api";
import type { Appointment } from "./types";

function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientId: 1,
    doctorId: 1,
    start: "",
    end: "",
    triageLevel: "LOW",
    triageNotes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<Appointment[]>("/api/Appointments");
      setAppointments(data);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await post<Appointment, any>("/api/Appointments", {
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        start: form.start,
        end: form.end,
        triageLevel: form.triageLevel || null,
        triageNotes: form.triageNotes || null,
      });
      await load();
      alert("Cita creada");
    } catch (e: any) {
      setError(e?.response?.data ?? e?.message ?? "Error al crear");
    }
  };

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">MediTriage – Citas</h1>

      <section className="mb-8 p-4 border rounded-xl">
        <h2 className="text-lg font-medium mb-3">Nueva cita</h2>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span>Patient ID</span>
              <input
                className="border rounded p-2"
                type="datetime-local"
                value={form.start}
                onChange={e => setForm({ ...form, start: e.target.value })}
                step="900" // opcional, pasos de 15 min
                required
              />
              <input
                className="border rounded p-2"
                type="datetime-local"
                value={form.end}
                onChange={e => setForm({ ...form, end: e.target.value })}
                step="900"
                required
              />
            </label>
            <label className="grid gap-1">
              <span>Doctor ID</span>
              <input
                className="border rounded p-2"
                type="datetime-local"
                value={form.start}
                onChange={e => setForm({ ...form, start: e.target.value })}
                step="900" // opcional, pasos de 15 min
                required
              />
              <input
                className="border rounded p-2"
                type="datetime-local"
                value={form.end}
                onChange={e => setForm({ ...form, end: e.target.value })}
                step="900"
                required
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span>Inicio</span>
              <input
                className="border rounded p-2"
                type="datetime-local"
                value={form.start}
                onChange={e => setForm({ ...form, start: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-1">
              <span>Término</span>
              <input
                className="border rounded p-2"
                type="datetime-local"
                value={form.end}
                onChange={e => setForm({ ...form, end: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span>Nivel de triage</span>
              <select
                className="border rounded p-2"
                value={form.triageLevel}
                onChange={e => setForm({ ...form, triageLevel: e.target.value })}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span>Notas</span>
              <input
                className="border rounded p-2"
                value={form.triageNotes}
                onChange={e => setForm({ ...form, triageNotes: e.target.value })}
                placeholder="Motivo, detalles, etc."
              />
            </label>
          </div>
          <button className="border rounded p-2 hover:bg-gray-50">Crear</button>
          {error && <p className="text-red-600 text-sm break-all">Error: {String(error)}</p>}
        </form>
      </section>

      <section className="p-4 border rounded-xl">
        <h2 className="text-lg font-medium mb-3">Listado</h2>
        {loading ? <p>Cargando…</p> : (
          <ul className="space-y-2">
            {appointments.map(a => (
              <li key={a.id} className="border rounded p-3">
                <div><b>ID:</b> {a.id}</div>
                <div><b>Paciente:</b> {a.patientId} – <b>Médico:</b> {a.doctorId}</div>
                <div><b>Inicio:</b> {new Date(a.start).toLocaleString()} — <b>Fin:</b> {new Date(a.end).toLocaleString()}</div>
                <div><b>Triage:</b> {a.triageLevel ?? "-"}</div>
                <div><b>Notas:</b> {a.triageNotes ?? "-"}</div>
              </li>
            ))}
            {appointments.length === 0 && <p>Sin citas aún.</p>}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
