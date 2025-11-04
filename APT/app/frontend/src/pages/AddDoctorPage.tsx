// src/pages/AddDoctorPage.tsx
import AdminNavBar from "../components/AdminNavBar";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { baseURL } from "../lib/api";

interface CreatedDoctor {
  id: number;        // id del doctor
  userId: number;    // id del usuario asociado
  name: string;
  specialty: string;
  email: string;
}

export default function AddDoctorPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("Medicina General");
  const [email, setEmail] = useState("");

  const [touched, setTouched] = useState({
    name: false,
    specialty: false,
    email: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedDoctor | null>(null);

  const isEmailValid = (value: string) =>
    /^[\w.-]+@[\w-]+\.[A-Za-z]{2,}$/.test(value);

  const isFormValid = () =>
    name.trim() !== "" &&
    specialty.trim() !== "" &&
    email.trim() !== "" &&
    isEmailValid(email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, specialty: true, email: true });
    setError("");

    if (!isFormValid()) return;

    if (!token) {
      setError("Token no disponible. Por favor inicia sesión de nuevo.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        specialty: specialty.trim(),
        email: email.trim(),
      };

      const res = await fetch(`${baseURL}/api/Doctors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || `Error del servidor: ${res.status}`);
        setLoading(false);
        return;
      }

      const json = await res.json();

      // tu API suele mandar { data: [ {...} ], message: "..." }
      // pero la dejamos tolerante
      let doc: any = null;
      if (Array.isArray(json.data) && json.data.length > 0) {
        doc = json.data[0];
      } else if (json.data && typeof json.data === "object") {
        doc = json.data;
      } else {
        doc = json;
      }

      if (!doc) {
        setError("Respuesta inesperada del servidor");
        setLoading(false);
        return;
      }

      const normalized: CreatedDoctor = {
        id: doc.id ?? doc.doctorId ?? 0,
        userId: doc.userId ?? doc.idUser ?? 0,
        name: doc.name ?? "",
        specialty: doc.specialty ?? "",
        email: doc.email ?? "",
      };

      setCreated(normalized);
    } catch (err) {
      console.error(err);
      setError("Error de red al crear el doctor");
    } finally {
      setLoading(false);
    }
  }

  // ====== VISTA DE ÉXITO ======
  if (created) {
    return (
      <>
        <AdminNavBar active="doctors" />
        <div className="max-w-2xl mx-auto p-6 mt-8">
          <h1 className="text-2xl font-bold mb-4">Doctor creado con éxito</h1>
          <div className="border rounded p-4 bg-white shadow space-y-1 text-sm">
            <p>
              <strong>DoctorId (id):</strong> {created.id}
            </p>
            <p>
              <strong>UserId:</strong> {created.userId}
            </p>
            <p>
              <strong>Nombre:</strong> {created.name}
            </p>
            <p>
              <strong>Especialidad:</strong> {created.specialty}
            </p>
            <p>
              <strong>Email:</strong> {created.email}
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate("/admin/doctors")}
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              Volver al listado
            </button>
            <button
              onClick={() => {
                // permitir crear otro
                setCreated(null);
                setName("");
                setEmail("");
                setSpecialty("Medicina General");
              }}
              className="px-4 py-2 rounded border"
            >
              Crear otro
            </button>
          </div>
        </div>
      </>
    );
  }

  // ====== FORM ======
  return (
    <>
      <AdminNavBar active="doctors" />
      <div className="max-w-2xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Agregar Doctor</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white p-4 rounded shadow"
        >
          {error && (
            <div className="text-red-600 text-sm border border-red-200 bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              className="border rounded px-2 py-1 w-full"
            />
            {touched.name && name.trim() === "" && (
              <div className="text-red-600 text-sm mt-1">
                El nombre es necesario
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Especialidad</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, specialty: true }))}
              className="border rounded px-2 py-1 w-full"
            >
              <option>Medicina General</option>
              <option>Dermatología</option>
              <option>Cardiología</option>
              <option>Pediatría</option>
              <option>Kinesiología</option>
            </select>
            {touched.specialty && specialty.trim() === "" && (
              <div className="text-red-600 text-sm mt-1">
                La especialidad es necesaria
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className="border rounded px-2 py-1 w-full"
            />
            {touched.email && email.trim() === "" && (
              <div className="text-red-600 text-sm mt-1">
                El email es necesario
              </div>
            )}
            {touched.email &&
              email.trim() !== "" &&
              !isEmailValid(email.trim()) && (
                <div className="text-red-600 text-sm mt-1">Email inválido</div>
              )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`px-4 py-2 rounded text-white ${
                !isFormValid() || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600"
              }`}
            >
              {loading ? "Enviando..." : "Confirmar Datos"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/doctors")}
              className="px-4 py-2 rounded border"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
