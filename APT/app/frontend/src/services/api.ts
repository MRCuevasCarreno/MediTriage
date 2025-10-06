import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5290/api"; // fallback seguro para dev

export const api = axios.create({ baseURL });

// opcional: setear JWT dinámico
export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
