import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";

// === Utilidades simples de UI ===
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>;
}

function Card({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-200 bg-white">
      {title && <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">{title}</h2></div>}
      <div className="px-6 py-4">{children}</div>
      {actions && <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">{actions}</div>}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }){
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-gray-200">{children}</span>
}

// === Simples de Auth (almacenamiento local) ===
const auth = {
  get token(){ return localStorage.getItem("mt_token"); },
  set token(v: string | null){ if(v) localStorage.setItem("mt_token", v); else localStorage.removeItem("mt_token"); },
  get role(){ return localStorage.getItem("mt_role") as "patient"|"doctor"|"admin"|null; },
  set role(v: string | null){ if(v) localStorage.setItem("mt_role", v); else localStorage.removeItem("mt_role"); },
};

// === Helper API (ajusta rutas a tu Backend .NET) ===
const API_BASE = "/api"; // ejemplo: proxied en Vite
async function apiFetch(path: string, opts: RequestInit = {}){
  const headers: Record<string,string> = { "Content-Type": "application/json" };
  if(auth.token) headers["Authorization"] = `Bearer ${auth.token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers: { ...headers, ...(opts.headers||{}) } });
  if(!res.ok){
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

const api = {
  login: (email: string, password: string) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (payload: any) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  me: () => apiFetch("/auth/me"),
  specialties: () => apiFetch("/catalog/specialties"),
  createAppointment: (payload: any) => apiFetch("/appointments", { method: "POST", body: JSON.stringify(payload) }),
  myAppointments: () => apiFetch("/appointments/mine"),
  triage: (payload: any) => apiFetch("/triage", { method: "POST", body: JSON.stringify(payload) }),
  doctorAppointments: () => apiFetch("/doctor/appointments"),
  adminStats: () => apiFetch("/admin/stats"),
};

// === Rutas protegidas ===
function Protected({ roles, children }:{ roles?: ("patient"|"doctor"|"admin")[], children: React.ReactNode }){
  const isLogged = Boolean(auth.token);
  const role = auth.role;
  const location = useLocation();
  if(!isLogged) return <Navigate to="/login" state={{ from: location }} replace/>;
  if(roles && role && !roles.includes(role)) return <Navigate to="/" replace/>;
  return <>{children}</>;
}

// === Layout principal con Navbar ===
function Navbar(){
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const role = auth.role;
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <Container>
        <div className="flex items-center justify-between py-4">{/* antes: py-3 */}
          <Link to="/" className="flex items-center gap-3">
            {/* Logo principal en desktop/tablet (más grande) */}
            <img
              src="/brand/medi-triage-logo.png"
              alt="MediTriage"
              className="hidden md:block h-14 lg:h-16 w-auto select-none drop-shadow-sm transition-opacity hover:opacity-90 shrink-0"
              draggable={false}
              decoding="async"
            />
            {/* Logo alterno en móviles (más grande) */}
            <img
              src="/brand/medi-triage-logo2.png"
              alt="MediTriage"
              className="md:hidden h-12 w-auto select-none drop-shadow-sm transition-opacity hover:opacity-90 shrink-0"
              draggable={false}
              decoding="async"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/book" className="hover:underline">Agendar</Link>
            <Link to="/triage" className="hover:underline">Triage</Link>
            {role === "patient" && <Link to="/appointments" className="hover:underline">Mis citas</Link>}
            {role === "doctor" && <Link to="/doctor" className="hover:underline">Médico</Link>}
            {role === "admin" && <Link to="/admin" className="hover:underline">Admin</Link>}
          </nav>

          <div className="flex items-center gap-3">
            {!auth.token ? (
              <>
                <Link to="/login" className="text-sm underline">Entrar</Link>
                <Link to="/register" className="text-sm rounded-xl px-3 py-1.5 border">Crear cuenta</Link>
              </>
            ) : (
              <button
                onClick={()=>{ auth.token = null; auth.role = null; navigate("/"); }}
                className="text-sm rounded-xl px-3 py-1.5 border"
              >Salir</button>
            )}
            <button className="md:hidden border rounded-xl px-3 py-1.5" onClick={()=>setOpen(!open)}>Menu</button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-3 flex flex-col gap-2">
            <Link to="/book" className="underline">Agendar</Link>
            <Link to="/triage" className="underline">Triage</Link>
            {auth.role === "patient" && <Link to="/appointments" className="underline">Mis citas</Link>}
            {auth.role === "doctor" && <Link to="/doctor" className="underline">Médico</Link>}
            {auth.role === "admin" && <Link to="/admin" className="underline">Admin</Link>}
          </div>
        )}
      </Container>
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }){
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar/>
      <Container>{children}</Container>
      <footer className="mt-12 border-t">
        <Container>
          <p className="text-xs text-gray-500 py-6">© {new Date().getFullYear()} MediTriage</p>
        </Container>
      </footer>
    </div>
  );
}

// === Páginas ===
function Home(){
  return (
    <Layout>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">Agenda con orientación inteligente</h1>
          <p className="text-gray-600">Reserva tu cita y recibe una orientación previa mediante un triage básico impulsado por IA y reglas clínicas.</p>
          <div className="flex gap-3">
            <Link to="/book" className="rounded-xl px-4 py-2 border">Agendar</Link>
            <Link to="/triage" className="rounded-xl px-4 py-2 border">Probar Triage</Link>
          </div>
        </div>
        <Card title="Resumen rápido">
          <ul className="space-y-2 text-sm">
            <li>✔ Registro y autenticación</li>
            <li>✔ Triage orientativo con banderas rojas</li>
            <li>✔ Panel de médico y administración</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
}

function Login(){
  const nav = useNavigate();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState<string|null>(null);
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/";

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    try{
      setError(null);
      // En real: const res = await api.login(email, password); auth.token=res.token; auth.role=res.role;
      auth.token = "devtoken";
      auth.role = email.includes("doctor") ? "doctor" : email.includes("admin") ? "admin" : "patient";
      nav(from, { replace: true });
    }catch(err:any){ setError(err.message); }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        {/* Logo alterno más grande en Login */}
        <img
          src="/brand/medi-triage-logo2.png"
          alt="MediTriage"
          className="h-14 md:h-16 w-auto mx-auto mb-4 select-none drop-shadow-sm"
          draggable={false}
          decoding="async"
        />
        <Card title="Entrar">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="text-sm">Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border px-3 py-2" placeholder="tu@correo.com"/>
            </div>
            <div>
              <label className="text-sm">Contraseña</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border px-3 py-2"/>
            </div>
            <div className="flex justify-end">
              <button className="rounded-xl px-4 py-2 border">Entrar</button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}

function Register(){
  const [form,setForm] = useState({ name:"", email:"", password:"", role:"patient" as "patient"|"doctor"|"admin"});
  const nav = useNavigate();
  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    // const res = await api.register(form);
    auth.token = "devtoken"; auth.role = form.role; nav("/");
  }
  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <Card title="Crear cuenta">
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm">Nombre</label>
              <input className="w-full rounded-xl border px-3 py-2" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
            </div>
            <div className="col-span-2">
              <label className="text-sm">Email</label>
              <input className="w-full rounded-xl border px-3 py-2" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
            </div>
            <div>
              <label className="text-sm">Rol</label>
              <select className="w-full rounded-xl border px-3 py-2" value={form.role} onChange={e=>setForm({...form, role:e.target.value as any})}>
                <option value="patient">Paciente</option>
                <option value="doctor">Médico</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Contraseña</label>
              <input type="password" className="w-full rounded-xl border px-3 py-2" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
            </div>
            <div className="col-span-2 flex justify-end">
              <button className="rounded-xl px-4 py-2 border">Crear</button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}

function BookAppointment(){
  const [step,setStep] = useState(1);
  const [form,setForm] = useState({ date: "", specialty: "", symptoms: "" });
  const [specialties,setSpecialties] = useState<string[]>(["Medicina General","Dermatología","Cardiología"]);
  // useEffect(()=>{ api.specialties().then((s)=>setSpecialties(s)); },[]);

  function Next(){ setStep(s=>Math.min(3,s+1)); }
  function Back(){ setStep(s=>Math.max(1,s-1)); }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4">
        <Card title="Agendar cita">
          <div className="flex items-center gap-2 mb-4">
            <Badge>1. Datos</Badge>
            <Badge>2. Síntomas</Badge>
            <Badge>3. Revisión</Badge>
          </div>
          {step===1 && (
            <div className="space-y-3">
              <div>
                <label className="text-sm">Fecha</label>
                <input type="date" className="w-full rounded-xl border px-3 py-2" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
              </div>
              <div>
                <label className="text-sm">Especialidad</label>
                <select className="w-full rounded-xl border px-3 py-2" value={form.specialty} onChange={e=>setForm({...form, specialty:e.target.value})}>
                  <option value="">Selecciona…</option>
                  {specialties.map(s=> <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-between">
                <span/>
                <button className="rounded-xl px-4 py-2 border" onClick={Next} disabled={!form.date||!form.specialty}>Siguiente</button>
              </div>
            </div>
          )}
          {step===2 && (
            <div className="space-y-3">
              <div>
                <label className="text-sm">Describe tus síntomas</label>
                <textarea className="w-full rounded-xl border px-3 py-2 min-h-[120px]" value={form.symptoms} onChange={e=>setForm({...form, symptoms:e.target.value})}/>
              </div>
              <div className="flex justify-between">
                <button className="rounded-xl px-4 py-2 border" onClick={Back}>Atrás</button>
                <button className="rounded-xl px-4 py-2 border" onClick={Next} disabled={!form.symptoms.trim()}>Siguiente</button>
              </div>
            </div>
          )}
          {step===3 && (
            <div className="space-y-3">
              <p className="text-sm">Revisa y confirma tu solicitud.</p>
              <ul className="text-sm list-disc ml-5">
                <li><b>Fecha:</b> {form.date || "—"}</li>
                <li><b>Especialidad:</b> {form.specialty || "—"}</li>
                <li><b>Síntomas:</b> {form.symptoms || "—"}</li>
              </ul>
              <div className="flex justify-between">
                <button className="rounded-xl px-4 py-2 border" onClick={Back}>Atrás</button>
                <button className="rounded-xl px-4 py-2 border" onClick={async()=>{
                  try{
                    // await api.createAppointment(form)
                    alert("Cita solicitada (demo)");
                  }catch(err:any){ alert(err.message); }
                }}>Confirmar</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

function Triage(){
  const [answers, setAnswers] = useState({ age: "", fever: false, painLevel: 3, notes: "" });
  const [result, setResult] = useState<any>(null);
  async function run(){
    try{
      // const r = await api.triage(answers);
      const r = { level: "No urgente", specialty: "Medicina General", redFlags: [] };
      setResult(r);
    }catch(err:any){ alert(err.message); }
  }
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card title="Triage orientativo">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Edad</label>
              <input className="w-full rounded-xl border px-3 py-2" value={answers.age} onChange={e=>setAnswers({...answers, age:e.target.value})}/>
            </div>
            <div className="flex items-end gap-2">
              <input id="fever" type="checkbox" checked={answers.fever} onChange={e=>setAnswers({...answers, fever:e.target.checked})}/>
              <label htmlFor="fever" className="text-sm">Fiebre</label>
            </div>
            <div className="col-span-2">
              <label className="text-sm">Dolor (1-10)</label>
              <input type="range" min={1} max={10} value={answers.painLevel} onChange={e=>setAnswers({...answers, painLevel:Number(e.target.value)})} className="w-full"/>
            </div>
            <div className="col-span-2">
              <label className="text-sm">Notas</label>
              <textarea className="w-full rounded-xl border px-3 py-2 min-h-[100px]" value={answers.notes} onChange={e=>setAnswers({...answers, notes:e.target.value})}/>
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
                <p><b>Banderas rojas:</b> {result.redFlags.length? result.redFlags.join(", ") : "Ninguna"}</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Appointments(){
  const [items,setItems] = useState<any[]>([]);
  useEffect(()=>{ (async()=>{
    try{
      // const res = await api.myAppointments();
      const res = [{ id: 1, date: "2025-09-22 10:00", specialty: "Medicina General", status: "Pendiente" }];
      setItems(res);
    }catch(err){ console.error(err); }
  })(); },[]);
  return (
    <Layout>
      <Card title="Mis citas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left"><th className="py-2">Fecha</th><th>Especialidad</th><th>Estado</th></tr></thead>
            <tbody>
              {items.map((r)=> (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.date}</td>
                  <td>{r.specialty}</td>
                  <td><Badge>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
}

function Doctor(){
  const [today,setToday] = useState<any[]>([]);
  useEffect(()=>{ (async()=>{
    try{
      // const res = await api.doctorAppointments();
      const res = [
        { id: 11, patient:"Juan Pérez", time:"09:00", reason:"Dolor abdominal", triage:"No urgente" },
        { id: 12, patient:"Ana Díaz", time:"09:30", reason:"Fiebre y tos", triage:"Prioritario" },
      ];
      setToday(res);
    }catch(err){ console.error(err); }
  })(); },[]);
  return (
    <Layout>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Agenda de hoy">
          <ul className="space-y-2 text-sm">
            {today.map(x=> (
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

function Admin(){
  const [stats,setStats] = useState<any>({ patients:0, doctors:0, appointments:0, noShows:0 });
  useEffect(()=>{ (async()=>{
    try{
      // const r = await api.adminStats();
      const r = { patients: 123, doctors: 12, appointments: 456, noShows: 18 };
      setStats(r);
    }catch(err){ console.error(err); }
  })(); },[]);

  const cards = [
    { label: "Pacientes", value: stats.patients },
    { label: "Médicos", value: stats.doctors },
    { label: "Citas", value: stats.appointments },
    { label: "No-shows", value: stats.noShows },
  ];

  return (
    <Layout>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c)=> (
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

function NotFound(){
  return (
    <Layout>
      <Card title="No encontrado"><p className="text-sm">La página no existe.</p></Card>
    </Layout>
  );
}

// === App con Router ===
export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/book" element={<Protected roles={["patient","admin"]}><BookAppointment/></Protected>} />
        <Route path="/triage" element={<Triage/>} />
        <Route path="/appointments" element={<Protected roles={["patient","admin"]}><Appointments/></Protected>} />
        <Route path="/doctor" element={<Protected roles={["doctor","admin"]}><Doctor/></Protected>} />
        <Route path="/admin" element={<Protected roles={["admin"]}><Admin/></Protected>} />
        <Route path="*" element={<NotFound/>} />
      </Routes>
    </BrowserRouter>
  );
}
