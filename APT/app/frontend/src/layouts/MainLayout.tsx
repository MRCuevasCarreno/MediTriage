// src/layouts/MainLayout.tsx
import { useState } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import Container from "../components/ui/Container";
import { useAuth, type Role } from "../auth/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const roleLabel: Record<Role, string> = {
    admin: "Admin",
    doctor: "Médico",
    patient: "Paciente",
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    (isActive ? "text-gray-900 font-semibold" : "text-gray-600 hover:text-gray-900") +
    " transition-colors";

  const displayName = user?.fullName ?? user?.email ?? "Usuario";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s?.[0]?.toUpperCase() ?? "")
      .join("") || "U";
  const role = (user?.role ?? "patient") as Role;
  const isDoctor = role === 'doctor';

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    logout?.();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <Container>
        <div className="relative h-28 md:h-32 flex items-center">
          <Link to="/" className="shrink-0 flex items-center gap-2">
            <img src="/brand/medi-triage-logo2.png" alt="MediTriage" className="hidden md:block h-24 lg:h-32 xl:h-36 w-auto" />
            <img src="/brand/medi-triage-logo2.png" alt="MediTriage" className="md:hidden h-24 lg:h-32 xl:h-36 w-auto" />
          </Link>

          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-10 text-sm">
            {!isDoctor ? (
                // Si el usuario es admin mostrar SOLO el link a Admin.
                user?.role === 'admin' ? (
                  <NavLink to="/admin" className={linkCls}>Admin</NavLink>
                ) : (
                  <>
                    <NavLink end to="/" className={linkCls}>Inicio</NavLink>
                    <NavLink to="/agendar-invitado" className={linkCls}>Agendar</NavLink>
                    <NavLink to="/triage" className={linkCls}>Triage</NavLink>
                    {role === 'patient' && (
                      <NavLink to="/my-appointments" className={linkCls}>Mis Citas</NavLink>
                    )}
                  </>
                )
              ) : (
                <NavLink to="/doctor" className={linkCls}>Dashboard Médico</NavLink>
              )}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {!user ? (
              <>
                <NavLink to="/login" className="text-sm underline underline-offset-4 decoration-1">Entrar</NavLink>
                <NavLink to="/register" className="text-sm rounded-xl border px-3 py-1.5 hover:bg-gray-50">Crear cuenta</NavLink>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                    {initials}
                  </div>
                  <div className="leading-tight text-right">
                    <div className="text-sm font-medium">{displayName}</div>
                    <div className="text-xs text-gray-500">{roleLabel[role]}</div>
                  </div>
                </div>
                {/* Badge para indicar modo administrador */}
                {role === 'admin' && (
                  <div className="hidden md:flex items-center ml-3">
                    <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l.364 1.12a1 1 0 00.95.69h1.178c.969 0 1.371 1.24.588 1.81l-.953.69a1 1 0 00-.364 1.118l.364 1.12c.3.921-.755 1.688-1.54 1.118l-.953-.69a1 1 0 00-1.175 0l-.953.69c-.785.57-1.84-.197-1.54-1.118l.364-1.12a1 1 0 00-.364-1.118l-.953-.69c-.783-.57-.38-1.81.588-1.81h1.178a1 1 0 00.95-.69l.364-1.12z" />
                      </svg>
                      Modo Administrador
                    </span>
                  </div>
                )}
                <button onClick={handleLogout} className="text-sm rounded-xl border px-3 py-1.5 hover:bg-gray-50">
                  Salir
                </button>
              </>
            )}

            <button className="md:hidden rounded-xl border px-3 py-1.5 text-sm" onClick={() => setOpen((v) => !v)} aria-label="Abrir menú">
              Menú
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-3 flex flex-col gap-2 text-sm">
            {!isDoctor ? (
              user?.role === 'admin' ? (
                <NavLink to="/admin" className={linkCls} onClick={() => setOpen(false)}>Admin</NavLink>
              ) : (
                <>
                  <NavLink end to="/" className={linkCls} onClick={() => setOpen(false)}>Inicio</NavLink>
                  <NavLink to="/agendar-invitado" className={linkCls} onClick={() => setOpen(false)}>Agendar</NavLink>
                  <NavLink to="/triage" className={linkCls} onClick={() => setOpen(false)}>Triage</NavLink>
                  {user && role === 'patient' && <NavLink to="/my-appointments" className={linkCls} onClick={() => setOpen(false)}>Mis citas</NavLink>}
                </>
              )
            ) : (
              <>
                <NavLink to="/doctor" className={linkCls} onClick={() => setOpen(false)}>Dashboard Médico</NavLink>
              </>
            )}
            {!user ? (
              <>
                <NavLink to="/login" className={linkCls} onClick={() => setOpen(false)}>Entrar</NavLink>
                <NavLink to="/register" className={linkCls} onClick={() => setOpen(false)}>Crear cuenta</NavLink>
              </>
            ) : (
              <button onClick={() => { setOpen(false); handleLogout(); }} className="text-left">Salir</button>
            )}
          </div>
        )}
      </Container>
    </header>
  );
}

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <main className="py-8 md:py-12">
        <Container>
          <Outlet />
        </Container>
      </main>
      <footer className="mt-8 border-t">
        <Container><div /></Container>
      </footer>
    </div>
  );
}
