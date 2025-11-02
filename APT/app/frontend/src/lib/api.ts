// src/lib/api.ts
import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

/**
 * =========================================================
 *  BaseURL del BACKEND
 *  Prioridad:
 *  1. VITE_API_BASE_URL (si la pusiste en .env)
 *  2. window.location.origin  (el mismo dominio que estás viendo: ngrok)
 *  3. https://localhost:7290  (último recurso para tu PC)
 * =========================================================
 */
const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

// OJO: window sólo existe en el navegador
const originBase =
  typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : undefined;

const rawBase = envBase || originBase || "https://localhost:7290";

// Quitar el trailing slash si lo hubiera
export const baseURL = rawBase;
console.info("[API] baseURL =", baseURL);

/**
 * =========================================================
 *  Gestión de Token
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
  withCredentials: false,
  timeout: 20000,
});

// Bootstrap del header Authorization desde localStorage
const bootToken = readToken();
if (bootToken) {
  api.defaults.headers.common.Authorization = `Bearer ${bootToken}`;
}

/**
 * =========================================================
 *  Interceptor de request
 * =========================================================
 */
api.interceptors.request.use((config) => {
  config.withCredentials = false;

  if (!config.headers) config.headers = {};
  // @ts-expect-error
  if (!config.headers.Authorization) {
    const t = readToken();
    if (t) {
      // @ts-expect-error
      config.headers.Authorization = `Bearer ${t}`;
    }
  }

  return config;
});

/**
 * =========================================================
 *  Interceptor de response
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
 * Helpers
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

export async function health(): Promise<"ok" | "down"> {
  try {
    await api.get("/api/health");
    return "ok";
  } catch {
    return "down";
  }
}
