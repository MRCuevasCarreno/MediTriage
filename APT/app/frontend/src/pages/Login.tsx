
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string|null>(null);
  const [emailError, setEmailError] = useState<string|null>(null);
  const [passwordError, setPasswordError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const { loginWithCredentials, user } = useAuth();
  const navigate = useNavigate();

  function validateEmail(email: string) {
    // Simple regex for email validation
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
      await loginWithCredentials(email, password);
      setLoading(false);
    } catch (err: any) {
      console.error('Error en login:', err);
      setError("Credenciales inválidas o error de red");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && user?.role) {
      if (user.role === "patient") {
        navigate("/", { replace: true });
      } else if (user.role === "doctor") {
        navigate("/doctor", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-80">
        <h1 className="text-xl font-bold mb-4">Login</h1>
        <form className="space-y-3" onSubmit={handleSubmit}>
          {/* Alerta general solo para error global */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 text-center">
              {error}
            </div>
          )}
          <div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full border px-3 py-2 rounded ${emailError ? 'border-red-500 bg-red-50' : ''}`}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {emailError && <div className="text-red-600 text-xs mt-1">{emailError}</div>}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className={`w-full border px-3 py-2 rounded ${passwordError ? 'border-red-500 bg-red-50' : ''}`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {passwordError && <div className="text-red-600 text-xs mt-1">{passwordError}</div>}
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {/* Alerta roja debajo del botón si hay error global */}
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

