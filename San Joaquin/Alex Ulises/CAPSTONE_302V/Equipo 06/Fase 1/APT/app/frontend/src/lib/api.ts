import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// helper simple
export const get = <T>(url: string) => api.get<T>(url).then(r => r.data);
export const post = <T, B>(url: string, body: B) => api.post<T>(url, body).then(r => r.data);
