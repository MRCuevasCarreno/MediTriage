import AdminNavBar from "../components/AdminNavBar";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { baseURL } from "../lib/api";

interface Doctor {
  id: number;
  userId: number;
  name: string;
  specialty: string;
  email: string;
  sucursal?: {
    id: number;
    name: string;
    address: string;
    location: string;
  }[];
}

interface Sucursal {
  id: number;
  nombre?: string;
  name?: string;
  direccion?: string;
  address?: string;
  comuna?: string;
  location?: string;
}

export default function ListDoctorPage() {
  const { token } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<"Asc" | "Desc">("Asc");
  const [sortField, setSortField] = useState<"name" | "specialty" | "email">("name");
  const [totalPages, setTotalPages] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalesLoading, setSucursalesLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState<Record<number, boolean>>({});
  const [selectedSucursal, setSelectedSucursal] = useState<Record<number, number | null>>({});
  const [assignLoading, setAssignLoading] = useState<Record<number, boolean>>({});
  const [assignMessage, setAssignMessage] = useState<Record<number, string>>({});

  // ====== LISTAR DOCTORES ======
  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      setError("");

      try {
        const params = [
          `PageNumber=${pageNumber}`,
          `PageSize=${pageSize}`,
          `SortBy=${sortField}`,
          `SortDirection=${sortBy}`,
        ];
        if (searchName.trim()) {
          params.push(`name=${encodeURIComponent(searchName.trim())}`);
        }

        const url = `${baseURL}/api/Doctors?${params.join("&")}`;

        const headers: Record<string, string> = {
          Accept: "application/json, text/plain, */*",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        // tu API parece devolver algo así: { data: { data: [...], totalPages: n } }
        const docs = json?.data?.data || [];
        const pages = json?.data?.totalPages || 1;

        setDoctors(docs);
        setTotalPages(pages);
      } catch (err) {
        console.error("Error al obtener doctores:", err);
        setError("Error al obtener doctores");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [pageNumber, pageSize, sortBy, sortField, searchName, token]);

  // ====== LISTAR SUCURSALES (una vez) ======
  useEffect(() => {
    async function fetchSucursales() {
      setSucursalesLoading(true);
      try {
        const headers: Record<string, string> = {
          Accept: "application/json, text/plain, */*",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${baseURL}/api/Sucursales`, {
          headers,
        });
        const json = await res.json();
        // API returns { data: [ ... ] }
        setSucursales(json.data || []);
      } catch (err) {
        console.warn("No se pudieron obtener sucursales", err);
      } finally {
        setSucursalesLoading(false);
      }
    }

    if (token) {
      fetchSucursales();
    }
  }, [token]);

  return (
    <>
      <AdminNavBar />
      <div className="max-w-3xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Listar Doctores</h1>

        {/* Filtros */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Buscar por nombre:</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Nombre del doctor"
              className="border rounded px-2 py-1 w-48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ordenar por:</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="border rounded px-2 py-1"
            >
              <option value="name">Nombre</option>
              <option value="specialty">Especialidad</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dirección de orden:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded px-2 py-1"
            >
              <option value="Asc">Ascendente</option>
              <option value="Desc">Descendente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tamaño de página:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {deleteMessage && <div className="mb-4 text-green-600">{deleteMessage}</div>}

        {/* Contenido */}
        {loading ? (
          <p>Cargando doctores...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="space-y-4">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="border rounded p-4 shadow flex justify-between items-start"
              >
                <div>
                  <div className="font-semibold text-lg mb-1">{doc.name}</div>
                  <div className="mb-1">Especialidad: {doc.specialty}</div>
                  <div className="mb-1">Email: {doc.email}</div>
                  <div className="mt-2">
                    <div className="font-medium">Sucursales que atiende:</div>
                    {doc.sucursal && doc.sucursal.length > 0 ? (
                      <div className="mt-1 space-y-1">
                        {doc.sucursal.map((s) => (
                          <div key={s.id} className="text-sm border rounded p-2 bg-gray-50">
                            <div>
                              <strong>{s.name}</strong>
                            </div>
                            <div className="text-gray-700">Dirección: {s.address}</div>
                            <div className="text-gray-700">Comuna: {s.location}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">No asignada</div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col items-end gap-2">
                  {/* Eliminar */}
                  <button
                    onClick={async () => {
                      if (!token) {
                        setDeleteMessage("Token no disponible.");
                        return;
                      }
                      try {
                        // tu payload original
                        const payload = { id: doc.userId, userId: doc.id };
                        const res = await fetch(`${baseURL}/api/Doctors`, {
                          method: "DELETE",
                          headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json, text/plain, */*",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify(payload),
                        });
                        if (!res.ok) {
                          const txt = await res.text().catch(() => "");
                          setDeleteMessage(`Error al eliminar: ${txt || res.status}`);
                          return;
                        }
                        setDeleteMessage(`Doctor eliminado: ${doc.name}`);
                        setDoctors((prev) => prev.filter((d) => d.id !== doc.id));
                      } catch (err) {
                        setDeleteMessage("Error de red al eliminar doctor");
                      }
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>

                  {/* Asignar sucursal */}
                  <div className="w-56">
                    <button
                      onClick={() =>
                        setAssignOpen((p) => ({ ...p, [doc.id]: !p[doc.id] }))
                      }
                      className="mt-2 w-full bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Asignar nueva Sucursal
                    </button>

                    {assignOpen[doc.id] && (
                      <div className="mt-2 bg-white border rounded p-2">
                        {sucursalesLoading ? (
                          <div className="text-sm">Cargando sucursales...</div>
                        ) : (
                          <>
                            <select
                              value={selectedSucursal[doc.id] ?? ""}
                              onChange={(e) =>
                                setSelectedSucursal((s) => ({
                                  ...s,
                                  [doc.id]: Number(e.target.value),
                                }))
                              }
                              className="w-full border rounded px-2 py-1 mb-2"
                            >
                              <option value="">-- Seleccionar sucursal --</option>
                              {sucursales.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.nombre || s.name}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={async () => {
                                const sucId = selectedSucursal[doc.id];
                                if (!sucId) {
                                  setAssignMessage((m) => ({
                                    ...m,
                                    [doc.id]: "Selecciona una sucursal",
                                  }));
                                  return;
                                }
                                if (!token) {
                                  setAssignMessage((m) => ({
                                    ...m,
                                    [doc.id]: "Token no disponible.",
                                  }));
                                  return;
                                }
                                setAssignLoading((l) => ({ ...l, [doc.id]: true }));
                                try {
                                  const body = { idDoctor: doc.id, idSucursal: sucId };
                                  const res = await fetch(
                                    `${baseURL}/api/Sucursales/assignDoctor`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Accept: "application/json, text/plain, */*",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify(body),
                                    }
                                  );
                                  if (!res.ok) {
                                    const txt = await res.text().catch(() => "");
                                    setAssignMessage((m) => ({
                                      ...m,
                                      [doc.id]: `Error al asignar: ${txt || res.status}`,
                                    }));
                                    return;
                                  }
                                  const json = await res.json().catch(() => null);
                                  // Expected: { data: [ { idDoctor, idSucursal, nombre, direccion, comuna } ], message }
                                  const assigned =
                                    json?.data &&
                                    Array.isArray(json.data) &&
                                    json.data[0]
                                      ? json.data[0]
                                      : null;
                                  if (!assigned) {
                                    setAssignMessage((m) => ({
                                      ...m,
                                      [doc.id]: "No se recibió respuesta válida del servidor",
                                    }));
                                    return;
                                  }

                                  // Actualizar el doctor en el estado
                                  setDoctors((prev) =>
                                    prev.map((d) =>
                                      d.id === doc.id
                                        ? {
                                            ...d,
                                            sucursal: [
                                              ...(d.sucursal || []),
                                              {
                                                id: assigned.idSucursal,
                                                name:
                                                  assigned.nombre ||
                                                  assigned.name ||
                                                  "",
                                                address:
                                                  assigned.direccion ||
                                                  assigned.address ||
                                                  "",
                                                location:
                                                  assigned.comuna ||
                                                  assigned.location ||
                                                  "",
                                              },
                                            ],
                                          }
                                        : d
                                    )
                                  );

                                  setAssignMessage((m) => ({
                                    ...m,
                                    [doc.id]: "Sucursal asignada correctamente",
                                  }));
                                  setAssignOpen((p) => ({ ...p, [doc.id]: false }));
                                } catch (err) {
                                  setAssignMessage((m) => ({
                                    ...m,
                                    [doc.id]: "Error de red al asignar sucursal",
                                  }));
                                } finally {
                                  setAssignLoading((l) => ({ ...l, [doc.id]: false }));
                                }
                              }}
                              className="w-full bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              {assignLoading[doc.id] ? "Asignando..." : "Asignar"}
                            </button>

                            {assignMessage[doc.id] && (
                              <div className="text-sm mt-2">{assignMessage[doc.id]}</div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        <div className="flex gap-2 mt-8 justify-center items-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setPageNumber(page)}
              className={`px-3 py-1 rounded border ${
                pageNumber === page
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
