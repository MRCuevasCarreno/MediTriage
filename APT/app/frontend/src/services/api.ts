import axios from "axios";

// Todas las llamadas irán al proxy local (/api)
const baseURL = "/api";

export const api = axios.create({ baseURL });

export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
