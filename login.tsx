import React, { useState } from "react";
import { baseURL, setAuthToken } from "../lib/api"; // 👈 importa tu baseURL

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateEmail(email: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
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
      const res = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Credenciales inválidas");
        setLoading(false);
        return;
      }

      const body = await res.json();

      // el backend a veces viene como { data: {...} }
      const payload = body?.data ? body.data : body;

      const token = payload.token;
      const expiresAtUtc = payload.expiresAtUtc;
      const fullName = payload.fullName;
      const role = payload.role;

      if (!token) {
        setError("No se recibió token del servidor");
        setLoading(false);
        return;
      }

      // ⬇️ esto escribe el header en axios y también en localStorage
      setAuthToken(token, "token");
      // extra: para compatibilidad con tu código que lee "authToken"
      try {
        localStorage.setItem("authToken", token);
        if (expiresAtUtc) localStorage.setItem("expiresAtUtc", expiresAtUtc);
        if (email) localStorage.setItem("email", email);
        if (fullName) localStorage.setItem("fullName", fullName);
        if (role) localStorage.setItem("role", role);
      } catch {
        /* ignore */
      }

      setLoading(false);

      // Redirigir según rol
      if (role === "Patient") {
        window.location.href = "/";
      } else if (role === "Doctor") {
        window.location.href = "/home/Doctor";
      } else if (role === "Admin") {
        window.location.href = "/home/admin";
      } else {
        // fallback
        window.location.href = "/";
      }
    } catch {
      setError("Error de red o servidor");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-80">
        <h1 className="text-xl font-bold mb-4">Login</h1>
        <form className="space-y-3" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 text-center">
              {error}
            </div>
          )}
          <div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full border px-3 py-2 rounded ${
                emailError ? "border-red-500 bg-red-50" : ""
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailError && <div className="text-red-600 text-xs mt-1">{emailError}</div>}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className={`w-full border px-3 py-2 rounded ${
                passwordError ? "border-red-500 bg-red-50" : ""
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {passwordError && (
              <div className="text-red-600 text-xs mt-1">{passwordError}</div>
            )}
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mt-3 text-center">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
