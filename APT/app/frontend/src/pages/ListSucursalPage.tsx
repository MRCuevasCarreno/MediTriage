import React, { useEffect, useState } from "react";
import AdminNavBar from "../components/AdminNavBar";
import { useAuth } from "../auth/AuthContext";
import { baseURL } from "../lib/api";

interface Doctor {
  id: number;
  userId: number;
  specialty: string;
  center: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  comuna: string;
  doctors: Doctor[] | null;
}

export default function ListSucursalPage() {
  const { token } = useAuth();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSucursales() {
      // si no hay token, no pegamos
      if (!token) {
        setError("No hay token de autenticación");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${baseURL}/api/Sucursales`, {
          headers: {
            accept: "application/json, text/plain, */*",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();

        // el backend a veces devuelve { data: [...] } y a veces un array directo,
        // así que lo normalizamos
        const data = Array.isArray(json) ? json : json.data || [];

        setSucursales(data);
        setError("");
      } catch (err) {
        console.error("Error al obtener sucursales:", err);
        setError("Error al obtener sucursales");
      } finally {
        setLoading(false);
      }
    }

    fetchSucursales();
  }, [token]);

  return (
    <>
      <AdminNavBar />
      <div className="max-w-3xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Listar Sucursales</h1>

        {loading ? (
          <p>Cargando sucursales...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="space-y-6">
            {sucursales.length === 0 ? (
              <p>No hay sucursales registradas.</p>
            ) : (
              sucursales.map((sucursal) => (
                <div key={sucursal.id} className="border rounded p-4 shadow">
                  <div className="font-semibold text-lg mb-1">{sucursal.nombre}</div>
                  <div className="mb-1">Dirección: {sucursal.direccion}</div>
                  <div className="mb-2">Comuna: {sucursal.comuna}</div>

                  <label className="block mb-1 font-medium">Doctores asociados:</label>
                  <select className="w-full border rounded px-2 py-1">
                    {sucursal.doctors && sucursal.doctors.length > 0 ? (
                      sucursal.doctors.map((doc) => (
                        <option key={doc.id}>
                          {doc.user?.name ?? "Sin nombre"} - {doc.specialty} ({doc.center})
                        </option>
                      ))
                    ) : (
                      <option>Sin doctores asociados</option>
                    )}
                  </select>

                  <button
                    className="mt-3 bg-red-600 text-white px-3 py-1 rounded opacity-60 cursor-not-allowed"
                    disabled
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
