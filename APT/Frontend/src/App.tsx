import { Link, Outlet, useNavigate } from "react-router-dom";
import { setAuthToken } from "./services/api";
import { useEffect } from "react";

export default function App() {
  const nav = useNavigate();

  // si ya hay token guardado, aplícalo al cargar
  useEffect(() => {
    const t = localStorage.getItem("jwt") ?? undefined;
    setAuthToken(t);
  }, []);

  const logout = () => {
    localStorage.removeItem("jwt");
    setAuthToken(undefined);
    nav("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold">MediTriage</Link>
          <nav className="space-x-4 text-sm">
            <Link to="/" className="hover:underline">Citas</Link>
            <Link to="/login" className="hover:underline">Login</Link>
            <button onClick={logout} className="text-red-600">Salir</button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
