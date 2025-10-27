// src/lib/api.ts
import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

/**
 * =========================================================
 *  BaseURL del BACKEND
 *  - Usa VITE_API_BASE_URL si existe (recomendado).
 *  - NO incluyas '/api' en la base; '/api' va en cada request.
 *  - Fallback a https://localhost:7290 (Kestrel dev).
 * =========================================================
 */
const rawBase =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "https://localhost:7290";

// Quitar el trailing slash si lo hubiera
export const baseURL = rawBase.replace(/\/$/, "");
console.info("[API] baseURL =", baseURL);

/**
 * =========================================================
 *  Gestión de Token
 *  - Leemos cualquiera de estas llaves: 'token' o 'authToken'
 *  - setAuthToken por defecto escribe en 'token' (puedes cambiarlo)
 * =========================================================
 */
export const TOKEN_KEYS = ["token", "authToken"] as const;
export type TokenKey = (typeof TOKEN_KEYS)[number];

function readToken(): string | null {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

/**
 * Setea o limpia el token en:
 * - Header Authorization del cliente axios,
 * - y (opcionalmente) localStorage bajo la llave indicada.
 */
export function setAuthToken(token: string | null, storageKey: TokenKey = "token") {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    try {
      localStorage.setItem(storageKey, token);
    } catch {
      /* ignore */
    }
  } else {
    delete api.defaults.headers.common.Authorization;
    try {
      TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }
}

/**
 * =========================================================
 *  Cliente Axios
 * =========================================================
 */
export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // No usamos cookies; todo va por Authorization
  timeout: 20000, // 20s para no colgar indefinidamente
});

// Bootstrap del header Authorization desde localStorage (si había token)
const bootToken = readToken();
if (bootToken) {
  api.defaults.headers.common.Authorization = `Bearer ${bootToken}`;
}

/**
 * =========================================================
 *  Interceptor de request
 *  - Garantiza withCredentials=false
 *  - Inyecta Authorization si aún no estuviera
 * =========================================================
 */
api.interceptors.request.use((config) => {
  config.withCredentials = false;

  // Si por alguna razón no está seteado, lo intentamos leer.
  if (!config.headers) config.headers = {};
  // @ts-expect-error: Axios headers indexados
  if (!("Authorization" in config.headers) || !config.headers.Authorization) {
    const t = readToken();
    if (t) {
      // @ts-expect-error: Axios headers indexados
      config.headers.Authorization = `Bearer ${t}`;
    }
  }

  return config;
});

/**
 * =========================================================
 *  Interceptor de response
 *  - Normaliza el mensaje de error para consumirlo fácil en el UI.
 * =========================================================
 */
export type ApiError = AxiosError & { status?: number; message: string };

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const payload = error.response?.data as any | undefined;

    let message: string =
      (payload && (payload.message || payload.error || payload.detail)) ||
      error.message ||
      "Error de red o del servidor";

    if (typeof message !== "string") {
      try {
        message = JSON.stringify(message);
      } catch {
        message = "Error inesperado";
      }
    }

    const norm: ApiError = Object.assign(error, { status, message });
    return Promise.reject(norm);
  }
);

/**
 * =========================================================
 *  Helpers genéricos (tipados)
 *  - Usa SIEMPRE rutas con '/api/...'
 *  - Ej: get<User>('/api/users/1')
 * =========================================================
 */
export async function get<T>(
  url: string,
  params?: Record<string, any>,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await api.get<T>(url, { params, ...(cfg || {}) });
  return res.data as T;
}

export async function post<T, B = unknown>(
  url: string,
  body?: B,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await api.post<T>(url, body, cfg);
  return res.data as T;
}

export async function put<T, B = unknown>(
  url: string,
  body?: B,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await api.put<T>(url, body, cfg);
  return res.data as T;
}

export async function patch<T, B = unknown>(
  url: string,
  body?: B,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await api.patch<T>(url, body, cfg);
  return res.data as T;
}

export async function del<T>(url: string, cfg?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<T>(url, cfg);
  return res.data as T;
}

/**
 * Subida de archivos (multipart/form-data)
 */
export async function upload<T>(
  url: string,
  file: File | Blob,
  extra?: Record<string, any>,
  fieldName = "file",
  cfg?: AxiosRequestConfig
): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file);

  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      form.append(k, typeof v === "string" ? v : JSON.stringify(v));
    }
  }

  const res = await api.post<T>(url, form, {
    ...cfg,
    headers: { ...(cfg?.headers || {}), "Content-Type": "multipart/form-data" },
  });

  return res.data as T;
}

/**
 * Ping rápido de salud del backend
 */
export async function health(): Promise<"ok" | "down"> {
  try {
    await api.get("/api/health");
    return "ok";
  } catch {
    return "down";
  }
}
