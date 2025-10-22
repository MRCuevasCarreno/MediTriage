// src/lib/api.ts
import axios from "axios";

// Apunta directo al backend (SIN /api)
export const baseURL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7290";
console.info("[API] baseURL =", baseURL);

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export const setAuthToken = (token: string | null) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

export const get = async <T>(url: string, params?: Record<string, any>): Promise<T> => {
  const res = await api.get<T>(url, { params });
  return res.data as T;
};

export const post = async <T, B = any>(url: string, body: B): Promise<T> => {
  const res = await api.post<T>(url, body);
  return res.data as T;
};
