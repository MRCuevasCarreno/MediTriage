// src/pages/Login.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { loginWithCredentials, user } = useAuth();
  const navigate = useNavigate();

  function validateEmail(e: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    let valid = true;
    if (!validateEmail(email)) {
      setEmailError("Ingresa un email válido");
      valid = false;
    }
    if (!password) {
      setPasswordError("Ingresa tu contraseña");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      await loginWithCredentials(email.trim(), password);
    } catch (err: any) {
      console.error("Error en login:", err);
      setError("Credenciales inválidas o error de red");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && user?.role) {
      if (user.role === "patient") navigate("/", { replace: true });
      else if (user.role === "doctor") navigate("/doctor", { replace: true });
      else if (user.role === "admin") navigate("/admin", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    // Sin ninguna clase bg-*; el fondo será el que tenga la página/parent
    <main className="w-full">
      <div className="min-h-[70vh] max-w-full flex items-center justify-center px-4 py-16">
        {/* Contenedor sin fondo, solo borde y sombra sutil */}
        <div className="w-full max-w-md rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-4">Iniciar sesión</h1>

          {error && (
            // Mensaje sin fondo (solo texto rojo)
            <div className="mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`h-11 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  emailError ? "border-red-500" : "border-gray-300"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && (
                <div className="text-red-600 text-xs mt-1">{emailError}</div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  className={`h-11 w-full rounded-xl border px-3 pr-16 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    passwordError ? "border-red-500" : "border-gray-300"
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto text-sm text-gray-500 hover:text-gray-700"
                >
                  {showPwd ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {passwordError && (
                <div className="text-red-600 text-xs mt-1">{passwordError}</div>
              )}
            </div>

            <button
              className="h-11 w-full rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
