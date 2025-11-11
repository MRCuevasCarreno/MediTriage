import AdminNavBar from '../components/AdminNavBar';

import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { baseURL } from "../lib/api";

export default function AddSucursalPage() {
  const { token } = useAuth();

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("");

  const [touched, setTouched] = useState({ nombre: false, direccion: false, comuna: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isFormValid = () => nombre.trim() !== "" && direccion.trim() !== "" && comuna.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nombre: true, direccion: true, comuna: true });
    setError("");
    setSuccess("");

    if (!isFormValid()) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }

    if (!token) {
      setError("Token no disponible. Inicia sesión nuevamente.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        comuna: comuna.trim(),
      };

      const res = await fetch(`${baseURL}/api/Sucursales`, {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (res.ok) {
        // expected { data: { id,.. }, message: 'Sucursal creada exitosamente.' }
        setSuccess("Sucursal creada con éxito.");

        // clear form
        setNombre("");
        setDireccion("");
        setComuna("");
        setTouched({ nombre: false, direccion: false, comuna: false });

        // hide success after 4s
        setTimeout(() => setSuccess(""), 4000);
      } else {
        const errMsg = json?.message || json?.error || `Error ${res.status}`;

        // duplicate name handling (backend may return 400 with message indicating exists)
        if (typeof errMsg === "string" && /existente|ya existe|already exists/i.test(errMsg)) {
          setError("Sucursal ya existente");
          setTimeout(() => setError(""), 4000);
        } else if (json?.error === "InvalidName") {
          setError("Sucursal ya existente");
          setTimeout(() => setError(""), 4000);
        } else {
          setError(errMsg || "Error al crear sucursal");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error de red al crear sucursal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AdminNavBar active="sucursales" />
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Crear nueva Sucursal</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
          {error && <div className="text-red-600 text-sm border border-red-200 bg-red-50 px-3 py-2 rounded">{error}</div>}
          {success && <div className="text-green-700 text-sm border border-green-200 bg-green-50 px-3 py-2 rounded">{success}</div>}

          <div>
            <label className="block font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, nombre: true }))}
              className="border rounded px-2 py-1 w-full"
            />
            {touched.nombre && nombre.trim() === "" && (
              <div className="text-red-600 text-sm mt-1">El nombre es obligatorio</div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, direccion: true }))}
              className="border rounded px-2 py-1 w-full"
            />
            {touched.direccion && direccion.trim() === "" && (
              <div className="text-red-600 text-sm mt-1">La dirección es obligatoria</div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Comuna</label>
            <select
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, comuna: true }))}
              className="border rounded px-2 py-1 w-full bg-white"
            >
              <option value="">-- Seleccione una comuna --</option>
              <option>Cerrillos</option>
              <option>Cerro Navia</option>
              <option>Conchalí</option>
              <option>El Bosque</option>
              <option>Estación Central</option>
              <option>Huechuraba</option>
              <option>Independencia</option>
              <option>La Cisterna</option>
              <option>La Florida</option>
              <option>La Granja</option>
              <option>La Pintana</option>
              <option>La Reina</option>
              <option>Las Condes</option>
              <option>Lo Barnechea</option>
              <option>Lo Espejo</option>
              <option>Lo Prado</option>
              <option>Macul</option>
              <option>Maipú</option>
              <option>Ñuñoa</option>
              <option>Padre Hurtado</option>
              <option>Pedro Aguirre Cerda</option>
              <option>Peñalolén</option>
              <option>Pirque</option>
              <option>Providencia</option>
              <option>Pudahuel</option>
              <option>Puente Alto</option>
              <option>Quilicura</option>
              <option>Quinta Normal</option>
              <option>Recoleta</option>
              <option>Renca</option>
              <option>San Bernardo</option>
              <option>San Joaquín</option>
              <option>San José de Maipo</option>
              <option>San Miguel</option>
              <option>San Ramón</option>
              <option>Santiago</option>
            </select>
            {touched.comuna && comuna.trim() === "" && (
              <div className="text-red-600 text-sm mt-1">La comuna es obligatoria</div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`px-4 py-2 rounded text-white ${!isFormValid() || loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"}`}
            >
              {loading ? "Enviando..." : "Crear Nueva Sucursal"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}