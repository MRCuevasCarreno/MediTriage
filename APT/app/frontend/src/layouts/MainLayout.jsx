import React, { useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";
import Container from "../components/ui/Container";
import { useAuth } from "../auth/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const linkCls = ({ isActive }) =>
    (isActive ? "text-gray-900 font-semibold" : "text-gray-600 hover:text-gray-900") +
    " transition-colors";

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <Container>
        {/* barra superior */}
        <div className="relative h-28 md:h-32 flex items-center">
          {/* logo: isotipo en móvil / logotipo horizontal en desktop */}
        <Link to="/" className="shrink-0 flex items-center gap-2">
  {/* Desktop */}
  <img
    src="/brand/medi-triage-logo2.png"
    alt="MediTriage"
    className="hidden md:block h-24 lg:h-32 xl:h-36 w-auto"
    decoding="async"
    draggable={false}
  />
  {/* Mobile (si quieres también un poco más grande que ahora) */}
  <img
    src="/brand/medi-triage-logo2.png"
    alt="MediTriage"
    className="md:hidden h-24 lg:h-32 xl:h-36 w-auto"
    decoding="async"
    draggable={false}
  />
</Link>


          {/* nav CENTRADO */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-10 text-sm">
            <NavLink end to="/" className={linkCls}>Inicio</NavLink>
            <NavLink to="/agendar-invitado" className={linkCls}>Agendar</NavLink>
            <NavLink to="/triage" className={linkCls}>Triage</NavLink>
            {user && <NavLink to="/appointments" className={linkCls}>Mis citas</NavLink>}
            {user?.role === "doctor" && <NavLink to="/doctor" className={linkCls}>Médico</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
          </nav>

          {/* acciones (derecha) */}
          <div className="ml-auto flex items-center gap-3">
            {!user ? (
              <>
                <NavLink to="/login" className="text-sm underline underline-offset-4 decoration-1">
                  Entrar
                </NavLink>
                <NavLink
                  to="/register"
                  className="text-sm rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                >
                  Crear cuenta
                </NavLink>
              </>
            ) : (
              <button
                onClick={logout}
                className="text-sm rounded-xl border px-3 py-1.5 hover:bg-gray-50"
              >
                Salir
              </button>
            )}

            {/* menú móvil */}
            <button
              className="md:hidden rounded-xl border px-3 py-1.5 text-sm"
              onClick={() => setOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              Menú
            </button>
          </div>
        </div>

        {/* menú móvil desplegable */}
        {open && (
          <div className="md:hidden pb-3 flex flex-col gap-2 text-sm">
            <NavLink end to="/" className={linkCls} onClick={() => setOpen(false)}>Inicio</NavLink>
            <NavLink to="/agendar-invitado" className={linkCls} onClick={() => setOpen(false)}>Agendar</NavLink>
            <NavLink to="/triage" className={linkCls} onClick={() => setOpen(false)}>Triage</NavLink>
            {user && <NavLink to="/appointments" className={linkCls} onClick={() => setOpen(false)}>Mis citas</NavLink>}
            {user?.role === "doctor" && <NavLink to="/doctor" className={linkCls} onClick={() => setOpen(false)}>Médico</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" className={linkCls} onClick={() => setOpen(false)}>Admin</NavLink>}
            {!user ? (
              <>
                <NavLink to="/login" className={linkCls} onClick={() => setOpen(false)}>Entrar</NavLink>
                <NavLink to="/register" className={linkCls} onClick={() => setOpen(false)}>Crear cuenta</NavLink>
              </>
            ) : (
              <button onClick={() => { setOpen(false); logout(); }} className="text-left">
                Salir
              </button>
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
        <Container>
          <p className="text-xs text-gray-500 py-6">© {new Date().getFullYear()} MediTriage</p>
        </Container>
      </footer>
    </div>
  );
}
