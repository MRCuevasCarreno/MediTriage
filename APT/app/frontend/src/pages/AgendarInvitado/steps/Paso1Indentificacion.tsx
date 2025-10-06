import { useState } from "react";
import { api } from "../../../services/api";
import { validateRut, formatRut, cleanRut } from "../../../utils/rut";

export type FoundPatient = { id: string; nombres: string; apellidos: string; rut: string } | null;

export default function Paso1Identificacion(
  { onNext }: { onNext: (data: { rut: string; patient?: FoundPatient; docType: "RUT" | "PASAPORTE" }) => void }
) {
  const [docType, setDocType] = useState<"RUT" | "PASAPORTE">("RUT");
  const [rut, setRut] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<FoundPatient>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setPatient(null);

    if (docType === "RUT") {
      if (!validateRut(rut)) { setError("RUT inválido"); return; }
      try {
        setLoading(true);
        const { data } = await api.get("/patients", { params: { rut: cleanRut(rut) } });
        setPatient(data?.[0] ?? null); // si no existe, sigue como invitado
      } catch { /* si falla la API igual seguimos */ }
      finally { setLoading(false); }
      onNext({ rut: cleanRut(rut), patient, docType });
    } else {
      onNext({ rut: "", patient: null, docType });
    }
  }

  return (
    <form onSubmit={handleContinue} className="max-w-2xl mx-auto p-6 rounded-2xl border bg-white">
      <h1 className="text-2xl font-semibold mb-1">Reserva de hora</h1>
      <p className="text-sm text-gray-500 mb-6">Paso 1: Identificar paciente</p>

      <label className="text-sm font-medium">Documento de identificación</label>
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value as any)}
        className="mt-1 mb-4 w-full rounded-xl border px-3 py-2"
      >
        <option value="RUT">RUT (Chile)</option>
        <option value="PASAPORTE">Pasaporte / Extranjería</option>
      </select>

      {docType === "RUT" && (
        <div className="mb-4">
          <label className="text-sm font-medium">RUT del Paciente</label>
          <input
            value={rut}
            onChange={(e) => setRut(formatRut(e.target.value))}
            placeholder="12.345.678-9"
            className={`mt-1 w-full rounded-xl border px-3 py-2 ${error ? "border-red-400" : ""}`}
            inputMode="text"
          />
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
      )}

      {patient && (
        <div className="mb-4 rounded-xl border px-4 py-3 bg-gray-50">
          <p className="text-sm text-gray-600">
            Paciente encontrado: <strong>{patient.nombres} {patient.apellidos}</strong>
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || (docType === "RUT" && !validateRut(rut))}
          className="rounded-2xl bg-black text-white px-5 py-2 disabled:opacity-50"
        >
          {loading ? "Buscando…" : "Continuar"}
        </button>
      </div>
    </form>
  );
}
