import React, { useEffect, useMemo, useState } from "react";
import { get } from "../lib/api";
import type { Appointment } from "../types";

type Row = { id:number; name?:string; [k:string]: any };

function usePager<T>(data: T[], pageSize=10){
  const [page, setPage] = useState(1);
  const maxPage = Math.max(1, Math.ceil(data.length / pageSize));
  const view = useMemo(()=> data.slice((page-1)*pageSize, page*pageSize), [data, page, pageSize]);
  return { page, setPage, maxPage, view };
}

export default function AdminTables(){
  const [tab, setTab] = useState<"patients"|"doctors"|"appointments">("appointments");
  const [patients, setPatients] = useState<Row[]>([]);
  const [doctors, setDoctors] = useState<Row[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [q, setQ] = useState("");

  useEffect(()=>{
    get<Row[]>("/api/patients").then(r=>setPatients(r as any)).catch(()=>{});
    get<Row[]>("/api/doctors").then(r=>setDoctors(r as any)).catch(()=>{});
    get<Appointment[]>("/api/appointments").then(r=>setAppointments(r as any)).catch(()=>{});
  },[]);

  const filterRows = (rows:Row[]) => rows.filter(r => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  const filterApps = (rows:Appointment[]) => rows.filter(r => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));

  const pPager = usePager(filterRows(patients));
  const dPager = usePager(filterRows(doctors));
  const aPager = usePager(filterApps(appointments));

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Panel administrador</h1>
      <div className="flex gap-2 mb-4">
        <button className={"px-3 py-1 rounded " + (tab==="appointments"?"bg-blue-600 text-white":"border")} onClick={()=>setTab("appointments")}>Citas</button>
        <button className={"px-3 py-1 rounded " + (tab==="patients"?"bg-blue-600 text-white":"border")} onClick={()=>setTab("patients")}>Pacientes</button>
        <button className={"px-3 py-1 rounded " + (tab==="doctors"?"bg-blue-600 text-white":"border")} onClick={()=>setTab("doctors")}>Doctores</button>
        <input className="ml-auto border rounded p-2" placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      {tab==="patients" && (
        <section>
          <table className="w-full border rounded">
            <thead><tr><th className="text-left p-2">ID</th><th className="text-left p-2">Nombre</th></tr></thead>
            <tbody>
              {pPager.view.map(p => (<tr key={p.id}><td className="p-2">{p.id}</td><td className="p-2">{p.name ?? (p as any).fullName ?? "-"}</td></tr>))}
            </tbody>
          </table>
          <Pager {...pPager} />
        </section>
      )}

      {tab==="doctors" && (
        <section>
          <table className="w-full border rounded">
            <thead><tr><th className="text-left p-2">ID</th><th className="text-left p-2">Nombre</th></tr></thead>
            <tbody>
              {dPager.view.map(d => (<tr key={d.id}><td className="p-2">{d.id}</td><td className="p-2">{d.name ?? (d as any).fullName ?? "-"}</td></tr>))}
            </tbody>
          </table>
          <Pager {...dPager} />
        </section>
      )}

      {tab==="appointments" && (
        <section>
          <table className="w-full border rounded text-sm">
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
              {aPager.view.map((a:any) => (
                <tr key={a.id}>
                  <td className="p-2">{a.id}</td>
                  <td className="p-2">{a.patientId}</td>
                  <td className="p-2">{a.doctorId}</td>
                  <td className="p-2">{a.start ? new Date(a.start).toLocaleString() : "-"}</td>
                  <td className="p-2">{a.end ? new Date(a.end).toLocaleString() : "-"}</td>
                  <td className="p-2">{a.triageLevel ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager {...aPager} />
        </section>
      )}
    </main>
  );
}

function Pager({ page, setPage, maxPage }:{ page:number; setPage:(n:number)=>void; maxPage:number }){
  return (
    <div className="flex items-center gap-2 mt-3">
      <button className="border rounded px-3 py-1" onClick={()=>setPage(Math.max(1, page-1))}>Anterior</button>
      <span>Página {page} / {maxPage}</span>
      <button className="border rounded px-3 py-1" onClick={()=>setPage(Math.min(maxPage, page+1))}>Siguiente</button>
    </div>
  );
}
