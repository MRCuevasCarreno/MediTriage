import React, { useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Badge from "../components/Badge";

export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ date: "", specialty: "", symptoms: "" });
  const [specialties] = useState<string[]>(["Medicina General", "Dermatología", "Cardiología"]);
  function Next() { setStep(s => Math.min(3, s + 1)); }
  function Back() { setStep(s => Math.max(1, s - 1)); }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4">
        <Card title="Agendar cita">
          <div className="flex items-center gap-2 mb-4">
            <Badge>1. Datos</Badge>
            <Badge>2. Síntomas</Badge>
            <Badge>3. Revisión</Badge>
          </div>
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-sm">Fecha</label>
                <input type="date" className="w-full rounded-xl border px-3 py-2" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Especialidad</label>
                <select className="w-full rounded-xl border px-3 py-2" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-between">
                <span />
                <button className="rounded-xl px-4 py-2 border" onClick={Next} disabled={!form.date || !form.specialty}>Siguiente</button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="text-sm">Describe tus síntomas</label>
                <textarea className="w-full rounded-xl border px-3 py-2 min-h-[120px]" value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} />
              </div>
              <div className="flex justify-between">
                <button className="rounded-xl px-4 py-2 border" onClick={Back}>Atrás</button>
                <button className="rounded-xl px-4 py-2 border" onClick={Next} disabled={!form.symptoms.trim()}>Siguiente</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm">Revisa y confirma tu solicitud.</p>
              <ul className="text-sm list-disc ml-5">
                <li><b>Fecha:</b> {form.date || "—"}</li>
                <li><b>Especialidad:</b> {form.specialty || "—"}</li>
                <li><b>Síntomas:</b> {form.symptoms || "—"}</li>
              </ul>
              <div className="flex justify-between">
                <button className="rounded-xl px-4 py-2 border" onClick={Back}>Atrás</button>
                <button className="rounded-xl px-4 py-2 border" onClick={async () => {
                  try {
                    // await api.createAppointment(form)
                    alert("Cita solicitada (demo)");
                  } catch (err: any) { alert(err.message); }
                }}>Confirmar</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
