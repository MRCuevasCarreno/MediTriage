import { useEffect, useMemo, useState } from "react";
import { fetchDoctors, fetchPatients, post, type ListItem } from "../lib/api";

type Option = { value: number; label: string };
const toOptions = (items: ListItem[]): Option[] =>
  items.map(i => ({ value: i.id, label: i.name })).sort((a,b) => a.label.localeCompare(b.label));

export default function NewAppointmentPage() {
  const [patients, setPatients] = useState<ListItem[]>([]);
  const [doctors, setDoctors] = useState<ListItem[]>([]);
  const [form, setForm] = useState({
    patientId: 0, doctorId: 0, start: "", end: "", triageLevel: "LOW", triageNotes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, d] = await Promise.all([fetchPatients(), fetchDoctors()]);
        setPatients(p); setDoctors(d);
        setForm(f => ({ ...f, patientId: f.patientId || (p[0]?.id ?? 0), doctorId: f.doctorId || (d[0]?.id ?? 0) }));
      } catch (e:any){ setError(e?.message ?? "Error cargando listas"); }
    };
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const body = { ...form, patientId: Number(form.patientId), doctorId: Number(form.doctorId), triageNotes: form.triageNotes?.trim() || null };
      await post("/api/appointments", body);
      alert("Cita creada");
    } catch (e:any){ setError(e?.response?.data?.message ?? e?.message ?? "Error al crear cita"); }
    finally { setLoading(false); }
  };

  const patientOptions = useMemo(()=>toOptions(patients),[patients]);
  const doctorOptions = useMemo(()=>toOptions(doctors),[doctors]);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nueva cita</h1>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm mb-1">Paciente</label>
          <select className="border rounded p-2" value={form.patientId} onChange={e=>setForm(f=>({...f, patientId:Number(e.target.value)}))}>
            {patientOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Doctor</label>
          <select className="border rounded p-2" value={form.doctorId} onChange={e=>setForm(f=>({...f, doctorId:Number(e.target.value)}))}>
            {doctorOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Inicio</label>
          <input type="datetime-local" className="border rounded p-2" value={form.start} onChange={e=>setForm(f=>({...f, start:e.target.value}))} required />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Fin</label>
          <input type="datetime-local" className="border rounded p-2" value={form.end} onChange={e=>setForm(f=>({...f, end:e.target.value}))} required />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Nivel de triage</label>
          <select className="border rounded p-2" value={form.triageLevel} onChange={e=>setForm(f=>({...f, triageLevel:e.target.value}))}>
            <option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
        <div className="md:col-span-2 flex flex-col">
          <label className="text-sm mb-1">Notas</label>
          <textarea className="border rounded p-2" rows={3} value={form.triageNotes} onChange={e=>setForm(f=>({...f, triageNotes:e.target.value}))} />
        </div>
        <div className="md:col-span-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60" disabled={loading || !form.patientId || !form.doctorId}>
            {loading ? "Guardando..." : "Crear cita"}
          </button>
          {error && <span className="ml-3 text-red-600">{error}</span>}
        </div>
      </form>
    </main>
  );
}
