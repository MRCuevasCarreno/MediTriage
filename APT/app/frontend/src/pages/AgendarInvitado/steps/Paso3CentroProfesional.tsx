// src/pages/AgendarInvitado/steps/Paso3CentroProfesional.tsx
import { useEffect, useMemo, useState } from "react";
import { baseURL } from "../../../lib/api";
import { useAuth } from "../../../auth/AuthContext";

type Center = { id: string; name: string; city: string; address: string };
type Professional = { id: string; name: string; centerId: string; services: string[] };

export default function Paso3CentroProfesional({
  onNext,
  onBack,
}: {
  onNext: (data: { centroId: string; profesionalId: string }) => void;
  onBack: () => void;
}) {
  const { token } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availableComunas, setAvailableComunas] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [comunaFilter, setComunaFilter] = useState<string>("");
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mapeo de especialidades a "ids" amigables y nombre para API
  const especialidades = [
    { id: "all", label: "Todas", apiName: "" },
    { id: "med-gen", label: "Medicina General", apiName: "Medicina General" },
    { id: "derm", label: "Dermatología", apiName: "Dermatología" },
    { id: "cardio", label: "Cardiología", apiName: "Cardiología" },
    { id: "pedi", label: "Pediatría", apiName: "Pediatría" },
    { id: "kine", label: "Kinesiología", apiName: "Kinesiología" },
    { id: "tele", label: "Telemedicina", apiName: "Telemedicina" },
  ] as const;

  // Especialidad sugerida desde el triage (si viene)
  const initialServicioId: string =
    (window as any).wizardData?.servicioId || "all";

  const [especialidadId, setEspecialidadId] = useState<string>(initialServicioId);

  // util: convierte un texto de especialidad del backend a nuestro id local
  function mapSpecialtyToId(s: string | undefined): string {
    const norm = (s || "").trim().toLowerCase();
    if (norm.includes("general")) return "med-gen";
    if (norm.includes("derm")) return "derm";
    if (norm.includes("cardio")) return "cardio";
    if (norm.includes("pedi")) return "pedi";
    if (norm.includes("kine")) return "kine";
    if (norm.includes("tele")) return "tele";
    return ""; // desconocida -> queda fuera si se filtra por especialidad
  }

  // Cargar sucursales (centros) + sus doctores (profesionales)
  useEffect(() => {
    let canceled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        // si tu API soporta filtro por especialidad/comuna, pásalos
        const apiName = especialidades.find(e => e.id === especialidadId)?.apiName || "";
        if (apiName) params.set("especialidad", apiName);
        if (comunaFilter) params.set("comuna", comunaFilter);

        const url = `${baseURL}/api/Sucursales${params.toString() ? `?${params.toString()}` : ""}`;
        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Error API (${res.status})`);
        const json = await res.json();

        const rows: any[] = Array.isArray(json?.data) ? json.data : [];

        // Centers
        const mappedCenters: Center[] = rows.map((c) => ({
          id: String(c.id),
          name: c.nombre || c.name || "Sin nombre",
          city: c.comuna || c.location || "",
          address: c.direccion || c.address || "",
        }));

        // Profesionales desde cada sucursal
        const mappedPros: Professional[] = rows.flatMap((c) => {
          const cid = String(c.id);
          const docs = c.doctors || c.Doctors || [];
          return (Array.isArray(docs) ? docs : []).map((d: any) => ({
            id: String(d.id),
            name: d.user?.name || d.name || "Sin nombre",
            centerId: cid,
            services: [mapSpecialtyToId(d.specialty)],
          }));
        });

        // Comunas disponibles (únicas)
        const comunas = Array.from(
          new Set(mappedCenters.map((c) => c.city).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));

        if (!canceled) {
          setCenters(mappedCenters);
          setProfessionals(mappedPros);
          setAvailableComunas(comunas);
          // si tengo selección previa y ya no existe, la limpio
          if (selectedCenter && !mappedCenters.find(c => c.id === selectedCenter)) {
            setSelectedCenter(null);
            setSelectedProfessional(null);
          }
        }
      } catch (e: any) {
        if (!canceled) setError(e.message || "No se pudieron cargar los centros.");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    load();
    return () => { canceled = true; };
  }, [baseURL, token, especialidadId, comunaFilter]);

  // Filtrado local por especialidad (si es "all" no filtra)
  const prosForService = useMemo(() => {
    if (especialidadId === "all") return professionals;
    return professionals.filter((p) => p.services.includes(especialidadId));
  }, [professionals, especialidadId]);

  // Mostrar solo centros que tengan al menos 1 profesional válido
  let centersOffering = useMemo(() => {
    const setCenterIds = new Set(prosForService.map((p) => p.centerId));
    return centers.filter((c) => setCenterIds.has(c.id));
  }, [centers, prosForService]);

  // Filtro de búsqueda por texto
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    centersOffering = centersOffering.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }

  const prosByCenter = (cid: string) =>
    prosForService.filter((p) => p.centerId === cid);

  // Persistimos datos útiles para pasos siguientes
  useEffect(() => {
    const wizardData = (window as any).wizardData || {};
    wizardData.centros = centers;
    wizardData.profesionales = professionals;
    wizardData.servicioId = especialidadId;
    (window as any).wizardData = wizardData;
  }, [centers, professionals, especialidadId]);

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl border bg-white mt-8">
      <h2 className="text-xl font-semibold mb-4">Selecciona centro y profesional</h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <input
          type="text"
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Buscar centro, comuna o dirección…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={especialidadId}
          onChange={(e) => setEspecialidadId(e.target.value)}
        >
          {especialidades.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={comunaFilter}
          onChange={(e) => setComunaFilter(e.target.value)}
        >
          <option value="">Todas las comunas</option>
          {availableComunas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500">Cargando centros y profesionales…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <ul className="mb-6">
          {centersOffering.map((center) => (
            <li key={center.id} className="mb-4">
              <div className="font-medium mb-1">{center.name}</div>
              <div className="text-xs text-gray-500 mb-2">
                {center.city} — {center.address}
              </div>
              <ul className="ml-1">
                {prosByCenter(center.id).map((prof) => {
                  const selected =
                    selectedProfessional === prof.id && selectedCenter === center.id;
                  return (
                    <li key={prof.id}>
                      <button
                        className={
                          "w-full text-left rounded-xl border px-4 py-2 mb-2 hover:bg-gray-50 " +
                          (selected ? "border-blue-500 bg-blue-50" : "")
                        }
                        onClick={() => {
                          setSelectedCenter(center.id);
                          setSelectedProfessional(prof.id);
                        }}
                      >
                        {prof.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
          {centersOffering.length === 0 && (
            <li className="text-sm text-gray-500">
              No hay centros que ofrezcan la especialidad seleccionada.
            </li>
          )}
        </ul>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="text-sm underline">
          &lt; Volver
        </button>
        <button
          className={`rounded-xl px-5 py-2 ${
            !selectedCenter || !selectedProfessional
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-black text-white"
          }`}
          disabled={!selectedCenter || !selectedProfessional}
          onClick={() => {
            if (!selectedCenter || !selectedProfessional) {
              setError("Debes seleccionar un centro y un profesional antes de continuar.");
              return;
            }
            setError(null);
            onNext({ centroId: selectedCenter, profesionalId: selectedProfessional });
          }}
        >
          Siguiente
        </button>
      </div>
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
    </div>
  );
}
