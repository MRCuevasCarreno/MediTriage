// src/lib/api.ts
import axios from "axios";

/**
 * Base URL = dominio público del front (o VITE_API_BASE_URL si lo definiste).
 * IMPORTANTE: NO incluyas '/api' aquí. El path '/api' va en cada request.
 */
const rawBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
// quitar trailing slash si lo hubiera
export const baseURL = rawBase.replace(/\/$/, "");
console.info("[API] baseURL =", baseURL);

export const api = axios.create({
  baseURL, // ejemplo real: https://enrico-unthrust-clare.ngrok-free.dev
  headers: { "Content-Type": "application/json" },
});

// Adjunta JWT en todas las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // no usamos cookies; todo por header
  config.withCredentials = false;
  return config;
});

// Helpers opcionales
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
