import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Badge from "../components/Badge";

export default function Doctor() {
  const [today, setToday] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        // const res = await api.doctorAppointments();
        const res = [
          { id: 11, patient: "Juan Pérez", time: "09:00", reason: "Dolor abdominal", triage: "No urgente" },
          { id: 12, patient: "Ana Díaz", time: "09:30", reason: "Fiebre y tos", triage: "Prioritario" },
        ];
        setToday(res);
      } catch (err) { console.error(err); }
    })();
  }, []);
  return (
    <Layout>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Agenda de hoy">
          <ul className="space-y-2 text-sm">
            {today.map(x => (
              <li key={x.id} className="border rounded-xl px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="font-medium">{x.time} – {x.patient}</p>
                  <p className="text-gray-600">{x.reason}</p>
                </div>
                <Badge>{x.triage}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Acciones rápidas">
          <div className="flex flex-wrap gap-2">
            <button className="rounded-xl px-3 py-1.5 border">Marcar llegada</button>
            <button className="rounded-xl px-3 py-1.5 border">Ver historial</button>
            <button className="rounded-xl px-3 py-1.5 border">Notas</button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
