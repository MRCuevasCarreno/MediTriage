import React, { createContext, useContext, useEffect, useState } from "react";
import { setAuthToken, post, get } from "../lib/api";

/** =========================================================
 *  Tipos de roles (frontend siempre en minúsculas)
 *  =======================================================*/
export type Role = "patient" | "doctor" | "admin";

/** Lo que podría venir desde el backend (número, string, etc.) */
type BackendRole =
  | Role
  | 0 | 1 | 2
  | "0" | "1" | "2"
  | "Patient" | "Doctor" | "Admin" | "Administrator";

/** Normaliza cualquier forma del backend a nuestro Role */
const normalizeRole = (r: BackendRole | null | undefined): Role => {
  if (r == null) return "patient";
  if (typeof r === "number") return r === 2 ? "admin" : r === 1 ? "doctor" : "patient";

  const s = String(r).toLowerCase();
  if (s === "2") return "admin";
  if (s === "1") return "doctor";
  if (s === "0") return "patient";
  if (s === "administrator") return "admin";
  if (s === "admin" || s === "doctor" || s === "patient") return s as Role;

  return "patient";
};

/** =========================================================
 *  Modelos
 *  =======================================================*/
type User = {
  id?: string | number;
  doctorId?: string | number;
  email?: string | null;
  fullName?: string | null;
  role?: Role | null;
};

type LoginResponse = {
  token: string;
  expiresAtUtc?: string;
  id?: string | number;
  doctorId?: string | number;
  email: string;
  fullName: string;
  role: BackendRole; // puede venir 2, "2", "Admin", etc.
};

type MeResponse = {
  id?: string | number;
  doctorId?: string | number;
  email: string;
  fullName: string; // el backend envía 'fullName'
  role: BackendRole;
};

/** =========================================================
 *  Contexto de Autenticación
 *  =======================================================*/
type AuthCtx = {
  token: string | null;
  user: User | null;
  /** listo para usar (ya terminó el /auth/me o se determinó que no hay token) */
  ready: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({
  token: null,
  user: null,
  ready: false,
  loginWithCredentials: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  /** Bootstrap de sesión: set header y consulta /auth/me */
  useEffect(() => {
    let canceled = false;

    async function bootstrap() {
      setReady(false);

      if (!token) {
        setAuthToken(null);
        setUser(null);
        if (!canceled) setReady(true);
        return;
      }

      setAuthToken(token);

      try {
        const me = await get<MeResponse>("/api/auth/me");
        if (!canceled) {
          setUser({
            id: me.id,
            doctorId: me.doctorId,
            email: me.email,
            fullName: me.fullName,
            role: normalizeRole(me.role),
          });
        }
      } catch (err: any) {
        // Sólo limpiar si es 401 (token inválido/expirado)
        if (!canceled && (err?.response?.status === 401)) {
          localStorage.removeItem("token");
          setAuthToken(null);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!canceled) setReady(true);
      }
    }

    bootstrap();
    return () => {
      canceled = true;
    };
  }, [token]);

  /** Login con credenciales */
  async function loginWithCredentials(email: string, password: string) {
    const res = await post<LoginResponse, { email: string; password: string }>(
      "/api/auth/login",
      { email, password }
    );

    // Subir el token inmediatamente
    setAuthToken(res.token);
    localStorage.setItem("token", res.token);
    setToken(res.token);

    setUser({
      id: res.id,
      doctorId: res.doctorId,
      email: res.email,
      fullName: res.fullName,
      role: normalizeRole(res.role),
    });

    // ya estamos listos para navegar
    setReady(true);
  }

  /** Logout */
  function logout() {
    localStorage.removeItem("token");
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setReady(true);
  }

  return (
    <Ctx.Provider value={{ token, user, ready, loginWithCredentials, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
