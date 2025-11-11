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
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalSucursal, setModalSucursal] = useState<Sucursal | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error' | null; text: string }>(
    { visible: false, type: null, text: '' }
  );

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

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-60"
                      onClick={() => {
                        // open modal instead of browser confirm
                        setModalSucursal(sucursal);
                        setShowDeleteModal(true);
                        setMessage(null);
                      }}
                      disabled={deletingId === sucursal.id}
                    >
                      {deletingId === sucursal.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                  </div>
                  </div>
              ))
            )}
          </div>
        )}
          {/* Toast container (top of page) */}
          {toast.visible && (
            <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4`}>
              <div className={`${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border rounded p-3 shadow`}>
                {toast.text}
              </div>
            </div>
          )}

          {/* Delete confirmation modal */}
          {showDeleteModal && modalSucursal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)} />
              <div className="bg-white rounded-lg p-6 z-50 max-w-md w-full shadow">
                <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
                <p className="text-sm text-gray-600">¿Eliminar sucursal '{modalSucursal.nombre}'? Esta acción no se puede deshacer.</p>
                <div className="mt-4 flex gap-3 justify-end">
                  <button className="px-3 py-1 rounded border" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                  <button
                    className="px-3 py-1 rounded bg-red-600 text-white"
                    onClick={async () => {
                      // perform delete
                      try {
                        if (!token) {
                          setToast({ visible: true, type: 'error', text: 'No hay token de autenticación' });
                          setShowDeleteModal(false);
                          setTimeout(() => setToast({ visible: false, type: null, text: '' }), 4000);
                          return;
                        }
                        setDeletingId(modalSucursal.id);
                        const res = await fetch(`${baseURL}/api/Sucursales/${modalSucursal.id}`, {
                          method: 'DELETE',
                          headers: {
                            accept: 'application/json, text/plain, */*',
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ nombre: modalSucursal.nombre, direccion: modalSucursal.direccion, comuna: modalSucursal.comuna }),
                        });

                        let json: any = null;
                        try { json = await res.json(); } catch { json = null; }

                        if (res.ok) {
                          setSucursales((s) => s.filter((x) => x.id !== modalSucursal.id));
                          setToast({ visible: true, type: 'success', text: `Sucursal '${modalSucursal.nombre}' Eliminada correctamente` });
                          setTimeout(() => setToast({ visible: false, type: null, text: '' }), 4000);
                        } else {
                          const msg = json?.message || json?.error || `Error ${res.status}`;
                          setToast({ visible: true, type: 'error', text: msg || 'Error al eliminar sucursal' });
                          setTimeout(() => setToast({ visible: false, type: null, text: '' }), 4000);
                        }
                      } catch (err: any) {
                        setToast({ visible: true, type: 'error', text: err?.message || 'Error de red al eliminar sucursal' });
                        setTimeout(() => setToast({ visible: false, type: null, text: '' }), 4000);
                      } finally {
                        setDeletingId(null);
                        setShowDeleteModal(false);
                        setModalSucursal(null);
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
}
