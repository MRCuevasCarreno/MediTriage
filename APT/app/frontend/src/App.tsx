import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";

/* ================================
   Utilidades de UI
   ================================ */
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

/* ================================
   Auth simple (localStorage)
   ================================ */
const auth = {
  get token(){ return localStorage.getItem("mt_token"); },
  set token(v: string | null){ if(v) localStorage.setItem("mt_token", v); else localStorage.removeItem("mt_token"); },
  get role(){ return localStorage.getItem("mt_role") as "patient"|"doctor"|"admin"|null; },
  set role(v: string | null){ if(v) localStorage.setItem("mt_role", v); else localStorage.removeItem("mt_role"); },
};

/* ================================
   Helper API (ajusta a tu backend)
   ================================ */
const API_BASE = "/api"; // proxied en Vite, ajusta si usas VITE_API_URL
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

/* ================================
   Ruta protegida por login/rol
   ================================ */
function Protected({ roles, children }:{ roles?: ("patient"|"doctor"|"admin")[], children: React.ReactNode }){
  const isLogged = Boolean(auth.token);
  const role = auth.role as "patient"|"doctor"|"admin"|null;
  const location = useLocation();
  if(!isLogged) return <Navigate to="/login" state={{ from: location }} replace/>;
  if(roles && (!role || !roles.includes(role))) return <Navigate to="/" replace/>;
  return <>{children}</>;
}

/* ================================
   Layout + Navbar
   ================================ */
function Navbar(){
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const role = auth.role;
  // Leer nombre del usuario si está logueado
  let userName = "";
  if (auth.token) {
    try {
      const user = JSON.parse(localStorage.getItem("mt_user") || "{}");
      userName = user.fullName || user.name || user.email || "";
    } catch {}
  }
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <Container>
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            {/* Logo desktop/tablet */}
            <img
              src="/brand/medi-triage-logo.png"
              alt="MediTriage"
              className="hidden md:block h-14 lg:h-16 w-auto select-none drop-shadow-sm transition-opacity hover:opacity-90 shrink-0"
              draggable={false}
              decoding="async"
            />
            {/* Logo móvil */}
            <img
              src="/brand/medi-triage-logo2.png"
              alt="MediTriage"
              className="md:hidden h-12 w-auto select-none drop-shadow-sm transition-opacity hover:opacity-90 shrink-0"
              draggable={false}
              decoding="async"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {/* Agendar público */}
            <Link to="/agendar-invitado" className="hover:underline">Agendar</Link>
            <Link to="/triage" className="hover:underline">Triage</Link>
            {role === "patient" && <Link to="/appointments" className="hover:underline">Mis citas</Link>}
            {role === "doctor" && <Link to="/doctor" className="hover:underline">Médico</Link>}
            {role === "admin" && <Link to="/admin" className="hover:underline">Admin</Link>}
          </nav>

          <div className="flex items-center gap-3">
            {auth.token && userName && (
              <span className="text-sm font-medium text-gray-700">{userName}</span>
            )}
            {!auth.token ? (
              <>
                <Link to="/login" className="text-sm underline">Entrar</Link>
                <Link to="/register" className="text-sm rounded-xl px-3 py-1.5 border">Crear cuenta</Link>
              </>
            ) : (
              <button
                onClick={()=>{ auth.token = null; auth.role = null; localStorage.removeItem("mt_user"); navigate("/"); }}
                className="text-sm rounded-xl px-3 py-1.5 border"
              >Salir</button>
            )}
            <button className="md:hidden border rounded-xl px-3 py-1.5" onClick={()=>setOpen(!open)}>Menu</button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-3 flex flex-col gap-2">
            <Link to="/agendar-invitado" className="underline">Agendar</Link>
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

/* ================================
   Páginas existentes
   ================================ */
function Home(){
  return (
    <Layout>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">Agenda con orientación inteligente</h1>
          <p className="text-gray-600">Reserva tu cita y recibe una orientación previa mediante un triage básico impulsado por IA y reglas clínicas.</p>
          <div className="flex gap-3">
            <Link to="/agendar-invitado" className="rounded-xl px-4 py-2 border">Agendar</Link>
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
      // Llamar API real de login
      const res = await fetch("https://localhost:7290/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error de autenticación");
      }
      const data = await res.json();
  // Guardar token y rol si vienen en la respuesta
  auth.token = data.token || data.accessToken || null;
  auth.role = data.role || data.Role || (email.includes("doctor") ? "doctor" : email.includes("admin") ? "admin" : "patient");
  // Guardar todo el usuario en localStorage (demo)
  localStorage.setItem("mt_user", JSON.stringify(data));
  nav(from, { replace: true });
    }catch(err:any){ setError(err.message); }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
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
  const [specialties] = useState<string[]>(["Medicina General","Dermatología","Cardiología"]);
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

/* =========================================================
   NUEVO: Flujo público /agendar-invitado — Pasos 1..4
   ========================================================= */
// Flujo público /agendar-invitado — Pasos 1..5 (Contacto + OTP + Confirmar)
function AgendarInvitado() {
  // ---- Tipos y mocks ----
  type Service = { id: string; name: string; description: string; icon: string };
  type Center  = { id: string; name: string; city: string; address: string };
  type Professional = { id: string; name: string; centerId: string; services: string[] };
  type Slot = { time: string; label: string; disabled?: boolean };

  const services: Service[] = [
    { id: "med-gen", name: "Medicina General", description: "Consulta integral, primera evaluación.", icon: "🩺" },
    { id: "derm",    name: "Dermatología",      description: "Piel, uñas y cabello.",                 icon: "🌤️" },
    { id: "cardio",  name: "Cardiología",       description: "Corazón y sistema cardiovascular.",     icon: "❤️" },
    { id: "pedi",    name: "Pediatría",         description: "Salud infantil y controles.",           icon: "🧸" },
    { id: "kine",    name: "Kinesiología",      description: "Rehabilitación y terapia física.",      icon: "🏃" },
    { id: "tele",    name: "Telemedicina",      description: "Atención en línea.",                    icon: "💻" },
  ];

  // Estado para sucursales y doctores
  const [centers, setCenters] = useState<Center[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [centersLoaded, setCentersLoaded] = useState(false);

  // Obtener sucursales y doctores desde API (timeout 3s)
  useEffect(() => {
    let didTimeout = false;
    setCentersLoaded(false);
    const timeout = setTimeout(() => {
      didTimeout = true;
      setCentersLoaded(true); // Usar locales si falla
    }, 3000);
    fetch("https://localhost:7290/api/Sucursales", { headers: { accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error("Error API");
        const json = await res.json();
        // Si la respuesta es la nueva estructura de sucursales con doctores
        if (!didTimeout && Array.isArray(json?.data)) {
          const apiCenters = json.data.map((c: any) => ({
            id: String(c.id),
            name: c.nombre,
            city: c.comuna,
            address: c.direccion
          }));
          setCenters(apiCenters);
          // Mapear doctores a Professional[]
          const apiProfessionals = json.data.flatMap((c: any) =>
            (c.doctors || []).map((d: any) => ({
              id: String(d.id),
              name: d.user?.name || d.name,
              centerId: String(c.id),
              services: [
                d.specialty === "Medicina General" ? "med-gen" :
                d.specialty === "Dermatología" ? "derm" :
                d.specialty === "Cardiología" ? "cardio" :
                d.specialty === "Pediatría" ? "pedi" :
                d.specialty === "Kinesiología" ? "kine" :
                d.specialty === "Telemedicina" ? "tele" :
                d.specialty?.toLowerCase() || ""
              ]
            }))
          );
          setProfessionals(apiProfessionals);
          setCentersLoaded(true);
          clearTimeout(timeout);
          console.log("Centros cargados:", apiCenters);
          console.log("Profesionales cargados:", apiProfessionals);
        }
      })
      .catch((err) => {
        setCentersLoaded(true); // Usar locales si falla
        clearTimeout(timeout);
        console.error("Error al cargar centros desde API:", err);
      });
    return () => clearTimeout(timeout);
  }, []);

  // ---- Estado del wizard ----
  const [step, setStep] = useState(1);
  const steps = ["Identificación", "Servicio", "Centro/Profesional", "Día y hora", "Confirmación"];

  // Paso 1
  const [docType, setDocType] = useState<"RUT"|"PASAPORTE">("RUT");
  const [rut, setRut] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Paso 2
  const [service, setService] = useState<Service | null>(null);

  // Paso 3
  const [query, setQuery] = useState("");
  const [centerId, setCenterId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  // Paso 4
  const [date, setDate] = useState<string>("");           // YYYY-MM-DD
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Paso 5 (Contacto + OTP + Confirmación)
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [consent, setConsent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpChannel, setOtpChannel] = useState<"email"|"sms" | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ bookingId?: string } | null>(null);

  // ---- Utils RUT ----
  function cleanRut(input: string) {
    return (input || "").replace(/[^0-9kK]/g, "").toUpperCase();
  }
  function formatRut(input: string) {
    const c = cleanRut(input);
    if (!c) return "";
    const cuerpo = c.slice(0, -1);
    const dv = c.slice(-1);
    const rev = cuerpo.split("").reverse().join("");
    const parts: string[] = [];
    for (let i = 0; i < rev.length; i += 3) parts.push(rev.slice(i, i + 3));
    const cuerpoFmt = parts.join(".").split("").reverse().join("");
    return `${cuerpoFmt}-${dv}`;
  }
  function validateRut(input: string) {
    const c = cleanRut(input);
    if (c.length < 2) return false;
    const cuerpo = c.slice(0, -1);
    const dv = c.slice(-1);
    let suma = 0, mul = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i], 10) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const res = 11 - (suma % 11);
    const dvCalc = res === 11 ? "0" : res === 10 ? "K" : String(res);
    return dvCalc === dv.toUpperCase();
  }

  // ---- Helpers slots (Paso 4) ----
  function pad(n: number){ return n < 10 ? `0${n}` : `${n}`; }
  function addMinutes(hhmm: string, delta: number) {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m + delta, 0, 0);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function rangeSlots(start: string, end: string, stepMin = 30): string[] {
    const out: string[] = [];
    let cur = start;
    while (cur < end) { out.push(cur); cur = addMinutes(cur, stepMin); }
    return out;
  }
  function isToday(dateStr: string) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
  }
  function nowHHMM() {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  function weekday(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.getDay(); // 0=domingo
  }
  function mockBookedTimes(center: string|null, prof: string|null, dateStr: string): string[] {
    if (!center || !dateStr) return [];
    const day = weekday(dateStr);
    const base = ["10:00", "11:30"];
    if (prof) base.push("16:00");
    if (day === 6) base.push("12:00"); // sábado
    return base;
  }
  function generateSlots(dateStr: string, serviceId?: string): Slot[] {
    if (!dateStr) return [];
    const day = weekday(dateStr);
    if (day === 0 && serviceId !== "tele") return []; // domingo cerrado salvo tele

    // L-V 09–13 / 15–19 — Sáb 09–13 — Tele 08–20
    let blocks: Array<[string,string]> = [];
    if (serviceId === "tele") {
      blocks = [["08:00","20:00"]];
    } else if (day >= 1 && day <= 5) {
      blocks = [["09:00","13:00"], ["15:00","19:00"]];
    } else if (day === 6) {
      blocks = [["09:00","13:00"]];
    }

    const times = blocks.flatMap(([a,b]) => rangeSlots(a,b,30));
    const booked = mockBookedTimes(centerId, professionalId, dateStr);
    const pastCut = isToday(dateStr) ? nowHHMM() : "00:00";
    return times.map(t => ({
      time: t,
      label: t,
      disabled: (isToday(dateStr) && t <= pastCut) || booked.includes(t)
    }));
  }

  useEffect(() => {
    setSelectedSlot(null);
    setSlots(generateSlots(date, service?.id));
  }, [date, service?.id, centerId, professionalId]);

  // Derivados Paso 3
  // Solo mostrar centros que tengan al menos un doctor con la especialidad seleccionada
  const prosForService = service
    ? professionals.filter(p => p.services.includes(service.id))
    : [];

  let centersOffering = centers.filter(center => {
    // Buscar si hay al menos un profesional en este centro con la especialidad seleccionada
    return prosForService.some(p => p.centerId === center.id);
  });
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    centersOffering = centersOffering.filter(c =>
      c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
    );
  }

  const prosByCenter = (cid: string) =>
    prosForService.filter(p => p.centerId === cid);

  // Datepicker límites (hoy → +60 días)
  function todayISO() {
    const d = new Date();
    const pad2 = (n:number)=> n<10?`0${n}`:`${n}`;
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }
  function plusDaysISO(days: number) {
    const d = new Date();
    const pad2 = (n:number)=> n<10?`0${n}`:`${n}`;
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }

  // Navegación de pasos
  function back() { setStep(s => Math.max(1, s - 1)); }
  function continuarPaso1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (docType === "RUT" && !validateRut(rut)) { setError("RUT inválido"); return; }
    setStep(2);
  }
  function continuarPaso2() {
    if (!service) return;
    setCenterId(null); setProfessionalId(null);
    setStep(3);
  }
  function continuarPaso3() {
    if (!centerId) return;
    const d = new Date();
    const pad2 = (n:number)=> n<10?`0${n}`:`${n}`;
    if (!date) setDate(`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`);
    setStep(4);
  }
  function continuarPaso4() {
    if (!date || !selectedSlot) return;
    setStep(5);
  }

  // ---- Validadores de contacto ----
  const validName = contact.name.trim().length >= 2;
  const validEmail = !contact.email ? false : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
  // Chile: +56 9 XXXXXXXX o 9 dígitos empezando en 9
  const validPhone = !contact.phone ? false : /^(\+?56)?9\d{8}$/.test(contact.phone.replace(/\s|-/g, ""));
  const hasSomeContact = validEmail || validPhone;

  // ---- OTP helpers ----
  function mask(v: string){
    if (!v) return "";
    if (v.includes("@")) {
      const [u, d] = v.split("@");
      const uu = u.length <= 2 ? u[0] + "*" : u[0] + "*".repeat(u.length-2) + u[u.length-1];
      return `${uu}@${d}`;
    }
    const vv = v.replace(/\D/g,"");
    return vv.length > 4 ? vv.slice(0,2) + "*".repeat(vv.length-4) + vv.slice(-2) : "*".repeat(vv.length);
  }

  async function sendOtp() {
    if (!hasSomeContact) return;
    try{
      const channel: "email"|"sms" = validEmail ? "email" : "sms";
      const value = channel === "email" ? contact.email : contact.phone;
      setOtpChannel(channel);

      // Intenta backend real:
      try {
        await apiFetch("/otp/send", { method: "POST", body: JSON.stringify({ channel, value, purpose: "appointment" })});
        setOtpSent(true);
        alert(`Te enviamos un código ${channel === "email" ? "al correo" : "por SMS"} a ${mask(value)}.`);
      } catch {
        // Fallback DEV: código 123456
        setOtpSent(true);
        alert("Backend OTP no disponible. Usa el código DEV: 123456");
      }
    }catch(err:any){
      alert(err.message || "No se pudo enviar el código.");
    }
  }

  async function verifyOtp() {
    if (!otpCode.trim()) return;
    const channel = otpChannel ?? (validEmail ? "email" : "sms");
    const value = channel === "email" ? contact.email : contact.phone;
    try{
      try{
        const res = await apiFetch("/otp/verify", { method:"POST", body: JSON.stringify({ value, code: otpCode })});
        if ((res as any)?.ok || res === "OK") {
          setOtpVerified(true);
          alert("Código verificado.");
          return;
        }
        throw new Error("Código inválido");
      }catch{
        // Fallback DEV:
        if (otpCode.trim() === "123456") {
          setOtpVerified(true);
          alert("Código verificado (DEV).");
        } else {
          throw new Error("Código inválido.");
        }
      }
    }catch(err:any){
      alert(err.message || "No se pudo verificar el código.");
    }
  }

// Genera un código local de reserva (solo DEMO)
function makeClientBookingId() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MT-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

 async function confirmBooking() {
  if (!otpVerified || !consent) return;
  setSubmitting(true);
  try {
    const payload = {
      guest: true,
      docType,
      rut: docType === "RUT" ? cleanRut(rut) : undefined,
      serviceId: service?.id,
      centerId,
      professionalId: professionalId || null,
      date,
      time: selectedSlot,
      contact,
      channel: "web",
    };

    // Intento real (si el backend existe):
    try {
      const res = await api.createAppointment(payload);
      const bookingId =
        (res as any)?.id ||
        (res as any)?.bookingId ||
        (res as any)?.code ||
        makeClientBookingId(); // por si no viene id del backend
      setDone({ bookingId });
    } catch (e) {
      // Fallback DEMO: no hay backend → no mostramos alert de 404
      console.warn("createAppointment falló, usando fallback DEMO:", e);
      setDone({ bookingId: makeClientBookingId() });
    }
  } finally {
    setSubmitting(false);
  }
}


  // Render
  return (
    <Layout>
      {/* Stepper */}
      <div className="max-w-4xl mx-auto mb-4">
        <ol className="flex items-center justify-between">
          {steps.map((label, i) => (
            <li key={label} className="flex-1">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${i+1<=step ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}>
                  {i+1}
                </div>
                <span className={`text-sm ${i+1===step ? "font-semibold" : "text-gray-500"}`}>{label}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Paso 1 */}
        {step === 1 && (
          <Card title="Paso 1: Identificar paciente">
            <form onSubmit={continuarPaso1} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Documento de identificación</label>
              {/*<select value={docType} onChange={(e)=>setDocType(e.target.value as any)} className="mt-1 w-full rounded-xl border px-3 py-2">
                  <option value="RUT">RUT (Chile)</option>
                  <option value="PASAPORTE">Pasaporte / Extranjería</option>
                </select>*/} 
              </div>

              {docType === "RUT" && (
                <div>
                  <label className="text-sm font-medium">RUT del paciente</label>
                  <input
                    value={rut}
                    onChange={(e)=>setRut(formatRut(e.target.value))}
                    placeholder="12.345.678-9"
                    className={`mt-1 w-full rounded-xl border px-3 py-2 ${error ? "border-red-400" : ""}`}
                  />
                  {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                </div>
              )}

              <div className="flex justify-end">
                <button className="rounded-xl px-4 py-2 border" disabled={docType==="RUT" && !validateRut(rut)}>Continuar</button>
              </div>
            </form>
          </Card>
        )}

        {/* Paso 2 */}
        {step === 2 && (
          <Card title="Paso 2: Seleccionar servicio">
            <div className="grid sm:grid-cols-2 gap-4">
              {services.map(s => {
                const selected = service?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={()=>{
                      console.log("Seleccionando especialidad:", s);
                      setService(s);
                    }}
                    className={`text-left rounded-2xl border px-4 py-4 hover:bg-gray-50 transition ${selected ? "border-black ring-1 ring-black" : "border-gray-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-4">
              <button className="rounded-xl px-4 py-2 border" onClick={()=>setStep(1)}>Atrás</button>
              <button className="rounded-xl px-4 py-2 border" onClick={()=>{
                console.log("Click Siguiente, service:", service);
                if(service) { setCenterId(null); setProfessionalId(null); setStep(3); }
              }} disabled={!service}>Siguiente</button>
            </div>

            {service && <p className="text-xs text-gray-500 mt-2">Seleccionado: <b>{service.name}</b></p>}
          </Card>
        )}

        {/* Paso 3 */}
        {step === 3 && (
          <Card title="Paso 3: Centro / Profesional">
            <div className="mb-4">
              <label className="text-sm font-medium">Buscar centro</label>
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Nombre, ciudad o dirección…" className="mt-1 w-full rounded-xl border px-3 py-2" />
              <p className="text-xs text-gray-500 mt-1">Mostrando centros que ofrecen: <b>{service?.name}</b></p>
            </div>

            <div className="space-y-3">
              {/* Mensaje si no hay centros cargados desde la API */}
              {!centersLoaded && <p className="text-sm text-gray-500">Cargando centros…</p>}
              {centersLoaded && centers.length === 0 && (
                <p className="text-sm text-red-600">No se pudo cargar ningún centro desde la API. Verifica la conexión o intenta más tarde.</p>
              )}
              {centersLoaded && centers.length > 0 && centersOffering.length === 0 && (
                <p className="text-sm text-gray-600">No hay centros que coincidan con tu búsqueda.</p>
              )}

              {centersLoaded && centersOffering.map(c => {
                const selected = centerId === c.id;
                const pros = prosByCenter(c.id);
                return (
                  <div key={c.id} className={`rounded-2xl border px-4 py-3 ${selected ? "border-black ring-1 ring-black" : "border-gray-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.city} — {c.address}</p>
                        <p className="text-xs text-gray-500 mt-1">Profesionales disponibles: {pros.length}</p>
                      </div>
                      <button type="button" onClick={()=>{ setCenterId(c.id); setProfessionalId(null); }} className="rounded-xl px-3 py-1.5 border text-sm">
                        {selected ? "Seleccionado" : "Elegir centro"}
                      </button>
                    </div>

                    {selected && pros.length > 0 && (
                      <div className="mt-3">
                        <label className="text-sm">Profesional (opcional)</label>
                        <select value={professionalId ?? ""} onChange={(e)=>setProfessionalId(e.target.value || null)} className="mt-1 w-full rounded-xl border px-3 py-2">
                          <option value="">Cualquiera disponible</option>
                          {pros.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-4">
              <button className="rounded-xl px-4 py-2 border" onClick={()=>setStep(2)}>Atrás</button>
              <button className="rounded-xl px-4 py-2 border" onClick={()=>{
                if (!centerId) return;
                const d = new Date(); const p=(n:number)=>n<10?`0${n}`:`${n}`;
                if (!date) setDate(`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`);
                setStep(4);
              }} disabled={!centerId}>
                Siguiente
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              <ul className="list-disc ml-5">
                <li><b>Documento:</b> {docType === "RUT" ? "RUT" : "Pasaporte/Extranjería"}</li>
                <li><b>RUT:</b> {docType === "RUT" ? rut || "—" : "—"}</li>
                <li><b>Servicio:</b> {service?.name || "—"}</li>
                <li><b>Centro:</b> {centerId ? centers.find(x=>x.id===centerId)?.name : "—"}</li>
                <li><b>Profesional:</b> {professionalId ? professionals.find(p=>p.id===professionalId)?.name : "Cualquiera"}</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Paso 4 */}
        {step === 4 && (
          <Card title="Paso 4: Elegir día y hora">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Fecha</label>
                <input type="date" value={date} min={todayISO()} max={plusDaysISO(60)} onChange={(e)=>setDate(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" />
                <p className="text-xs text-gray-500 mt-2">
                  {service?.id==="tele"
                    ? "Telemedicina disponible todos los días (08:00–20:00)."
                    : "Domingo cerrado. L-V 09–13 / 15–19, Sáb 09–13."}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">Horarios disponibles</label>
                {!date && <p className="text-sm text-gray-500 mt-2">Selecciona una fecha para ver los horarios.</p>}
                {date && slots.length === 0 && <p className="text-sm text-gray-500 mt-2">No hay horarios para este día.</p>}
                {date && slots.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {slots.map(s => {
                      const selected = selectedSlot === s.time;
                      return (
                        <button
                          key={s.time}
                          type="button"
                          disabled={s.disabled}
                          onClick={()=>setSelectedSlot(s.time)}
                          className={`rounded-xl border px-3 py-2 text-sm
                            ${s.disabled ? "opacity-40 cursor-not-allowed" :
                              selected ? "border-black ring-1 ring-black" : "border-gray-200 hover:bg-gray-50"}`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button className="rounded-xl px-4 py-2 border" onClick={()=>setStep(3)}>Atrás</button>
              <button className="rounded-xl px-4 py-2 border" onClick={()=>{ if(date && selectedSlot){ setStep(5); } }} disabled={!date || !selectedSlot}>
                Siguiente
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              <ul className="list-disc ml-5">
                <li><b>Servicio:</b> {service?.name || "—"}</li>
                <li><b>Centro:</b> {centerId ? centers.find(x=>x.id===centerId)?.name : "—"}</li>
                <li><b>Profesional:</b> {professionalId ? professionals.find(p=>p.id===professionalId)?.name : "Cualquiera"}</li>
                <li><b>Fecha:</b> {date || "—"}</li>
                <li><b>Hora:</b> {selectedSlot || "—"}</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Paso 5: Contacto + OTP + Confirmar */}
        {step === 5 && !done && (
          <Card title="Paso 5: Datos de contacto y confirmación">
            {/* Resumen */}
            <div className="mb-4 text-sm">
              <p className="font-medium">Revisa tu reserva:</p>
              <ul className="list-disc ml-5 text-gray-700">
                <li><b>Documento:</b> {docType === "RUT" ? `RUT ${rut || "—"}` : "Pasaporte/Extranjería"}</li>
                <li><b>Servicio:</b> {service?.name}</li>
                <li><b>Centro:</b> {centerId ? centers.find(x=>x.id===centerId)?.name : "—"}</li>
                <li><b>Profesional:</b> {professionalId ? professionals.find(p=>p.id===professionalId)?.name : "Cualquiera"}</li>
                <li><b>Fecha:</b> {date}</li>
                <li><b>Hora:</b> {selectedSlot}</li>
              </ul>
            </div>

            {/* Contacto */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Nombre completo</label>
                <input
                  value={contact.name}
                  onChange={(e)=>setContact({...contact, name:e.target.value})}
                  placeholder="Nombre y apellido"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Correo (opcional)</label>
                <input
                  value={contact.email}
                  onChange={(e)=>setContact({...contact, email:e.target.value})}
                  placeholder="tu@correo.com"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                />
                {!contact.email ? <p className="text-xs text-gray-500 mt-1">Puedes usar solo celular si prefieres.</p>
                  : !validEmail && <p className="text-xs text-red-600 mt-1">Correo no válido.</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Celular (opcional)</label>
                <input
                  value={contact.phone}
                  onChange={(e)=>setContact({...contact, phone:e.target.value})}
                  placeholder="+56 9 1234 5678"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                />
                {!contact.phone ? <p className="text-xs text-gray-500 mt-1">Puedes usar solo correo si prefieres.</p>
                  : !validPhone && <p className="text-xs text-red-600 mt-1">Formato esperado: +569XXXXXXXX o 9XXXXXXXX.</p>}
              </div>
            </div>

            {/* OTP */}
            <div className="mt-4 rounded-2xl border px-4 py-3">
              <p className="text-sm font-medium">Verificación (OTP)</p>
              <p className="text-xs text-gray-500 mb-2">Te enviaremos un código por {validEmail ? "correo" : "SMS"} para validar la reserva.</p>

              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={!validName || !hasSomeContact || otpVerified}
                  className="rounded-xl px-3 py-1.5 border text-sm"
                >
                  {otpSent ? "Reenviar código" : "Enviar código"}
                </button>

                <input
                  value={otpCode}
                  onChange={(e)=>setOtpCode(e.target.value)}
                  placeholder="Código"
                  className="rounded-xl border px-3 py-1.5 text-sm"
                  style={{width: 120}}
                  disabled={!otpSent || otpVerified}
                />

                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={!otpSent || !otpCode.trim() || otpVerified}
                  className="rounded-xl px-3 py-1.5 border text-sm"
                >
                  Verificar
                </button>
              </div>

              {!otpSent && (
                <p className="text-xs text-gray-500 mt-2">
                  Si tu backend OTP aún no está listo, usa el <b>código DEV 123456</b> tras “Enviar código”.
                </p>
              )}
              {otpVerified && <p className="text-xs text-green-600 mt-2">Código verificado ✅</p>}
            </div>

            {/* Consentimiento */}
            <div className="mt-4 flex items-center gap-2">
              <input id="consent" type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} />
              <label htmlFor="consent" className="text-sm">
                Acepto los términos y el tratamiento de mis datos para gestionar mi reserva.
              </label>
            </div>

            {/* Acciones */}
            <div className="flex justify-between mt-4">
              <button className="rounded-xl px-4 py-2 border" onClick={()=>setStep(4)}>Atrás</button>
              <button
                className="rounded-xl px-4 py-2 border"
                onClick={confirmBooking}
                disabled={!validName || !hasSomeContact || !otpVerified || !consent || submitting}
              >
                {submitting ? "Confirmando…" : "Confirmar reserva"}
              </button>
            </div>
          </Card>
        )}

        {/* Éxito */}
        {step === 5 && done && (
          <Card title="¡Reserva confirmada!">
            <p className="text-sm text-gray-700">
              Tu cita quedó registrada correctamente.
              {done.bookingId && <> Código de reserva: <b>{done.bookingId}</b>.</>}
            </p>
            <ul className="text-sm list-disc ml-5 mt-2">
              <li><b>Servicio:</b> {service?.name}</li>
              <li><b>Centro:</b> {centerId ? centers.find(x=>x.id===centerId)?.name : "—"}</li>
              <li><b>Profesional:</b> {professionalId ? professionals.find(p=>p.id===professionalId)?.name : "Cualquiera"}</li>
              <li><b>Fecha:</b> {date}</li>
              <li><b>Hora:</b> {selectedSlot}</li>
              <li><b>Contacto:</b> {contact.name} {contact.email && `· ${contact.email}`} {contact.phone && `· ${contact.phone}`}</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Link to="/" className="rounded-xl px-4 py-2 border">Volver al inicio</Link>
              <Link to="/agendar-invitado" className="rounded-xl px-4 py-2 border">Hacer otra reserva</Link>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}


/* ================================
   App con Router
   ================================ */
export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />

        {/* NUEVA ruta pública */}
        <Route path="/agendar-invitado" element={<AgendarInvitado/>} />

        {/* Rutas protegidas ya existentes */}
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
