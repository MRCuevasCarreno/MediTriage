import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";

export default function Admin() {
  const [stats, setStats] = useState<any>({ patients: 0, doctors: 0, appointments: 0, noShows: 0 });
  useEffect(() => {
    (async () => {
      try {
        // const r = await api.adminStats();
        const r = { patients: 123, doctors: 12, appointments: 456, noShows: 18 };
        setStats(r);
      } catch (err) { console.error(err); }
    })();
  }, []);

  const cards = [
    { label: "Pacientes", value: stats.patients },
    { label: "Médicos", value: stats.doctors },
    { label: "Citas", value: stats.appointments },
    { label: "No-shows", value: stats.noShows },
  ];

  return (
    <Layout>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border p-4 bg-white">
            <p className="text-sm text-gray-600">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <Card title="Operaciones" actions={<button className="rounded-xl px-3 py-1.5 border">Exportar</button>}>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li>Configurar especialidades</li>
            <li>Asignar agenda a médicos</li>
            <li>Revisar reportes</li>
          </ul>
        </Card>
        <Card title="Alertas">
          <p className="text-sm text-gray-600">Sin alertas por ahora.</p>
        </Card>
      </div>
    </Layout>
  );
}
