import axios from "axios";

export const api = axios.create({
  baseURL: "https://localhost:7000/api", // tu backend
});

// opcional: setear JWT dinámico
export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
