import React, { useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";

export default function Triage() {
  const [answers, setAnswers] = useState({ age: "", fever: false, painLevel: 3, notes: "" });
  const [result, setResult] = useState<any>(null);
  async function run() {
    try {
      const res = await fetch("https://localhost:7290/api/ai/triage", {
        method: "POST",
        headers: {
          "accept": "text/plain",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          age: Number(answers.age),
          fever: answers.fever,
          pain: Number(answers.painLevel),
          notes: answers.notes
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const api = await res.json();
      setResult({
        level: api.data.level || "—",
        specialty: api.data.specialist || "—",
        redFlags: api.data.redFlag ? ["Sí"] : []
      });
    } catch (err: any) { alert(err.message); }
  }
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card title="Triage orientativo">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Edad</label>
              <input className="w-full rounded-xl border px-3 py-2" value={answers.age} onChange={e => setAnswers({ ...answers, age: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <input id="fever" type="checkbox" checked={answers.fever} onChange={e => setAnswers({ ...answers, fever: e.target.checked })} />
              <label htmlFor="fever" className="text-sm">Fiebre</label>
            </div>
            <div className="col-span-2">
              <label className="text-sm">Dolor (1-10)</label>
              <input type="range" min={1} max={10} value={answers.painLevel} onChange={e => setAnswers({ ...answers, painLevel: Number(e.target.value) })} className="w-full" />
            </div>
            <div className="col-span-2">
              <label className="text-sm">Notas</label>
              <textarea className="w-full rounded-xl border px-3 py-2 min-h-[100px]" value={answers.notes} onChange={e => setAnswers({ ...answers, notes: e.target.value })} />
            </div>
            <div className="col-span-2 flex justify-end">
              <button className="rounded-xl px-4 py-2 border" onClick={run}>Evaluar</button>
            </div>
          </div>
        </Card>
        {result && (
          <div className="mt-4">
            <Card title="Resultado">
              <div className="space-y-2 text-sm">
                <p><b>Nivel:</b> {result.level}</p>
                <p><b>Sugerencia de especialidad:</b> {result.specialty}</p>
                <p><b>Banderas rojas:</b> {result.redFlags.length ? result.redFlags.join(", ") : "Ninguna"}</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
