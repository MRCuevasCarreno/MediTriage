import React, { useEffect, useState } from "react";

export default function Paso3CentroProfesional({ onNext, onBack }: { onNext: (data: { centroId: string, profesionalId: string }) => void, onBack: () => void }) {
  const [error, setError] = useState<string | null>(null);
  // Tipos
  type Center  = { id: string; name: string; city: string; address: string };
  type Professional = { id: string; name: string; centerId: string; services: string[] };

  // Estado
  const [centers, setCenters] = useState<Center[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string|null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string|null>(null);

  // Obtener especialidad seleccionada
  const servicioId = (window as any).wizardData?.servicioId || "med-gen";

  // Cargar centros y profesionales desde API
  useEffect(() => {
    setLoading(true);
    fetch("https://localhost:7290/api/Sucursales", {
      headers: {
        accept: "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
      }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Error API");
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          const apiCenters = json.data.map((c: any) => ({
            id: String(c.id),
            name: c.nombre,
            city: c.comuna,
            address: c.direccion
          }));
          setCenters(apiCenters);
          // Mapear doctores a Professional[]
          const apiProfessionals = json.data.flatMap((c: any) =>
            (c.doctors || []).map((d: any) => ({
              id: String(d.id),
              name: d.user?.name || d.name,
              centerId: String(c.id),
              services: [
                d.specialty === "Medicina General" ? "med-gen" :
                d.specialty === "Dermatología" ? "derm" :
                d.specialty === "Cardiología" ? "cardio" :
                d.specialty === "Pediatría" ? "pedi" :
                d.specialty === "Kinesiología" ? "kine" :
                d.specialty === "Telemedicina" ? "tele" :
                d.specialty?.toLowerCase() || ""
              ]
            }))
          );
          setProfessionals(apiProfessionals);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filtrar profesionales por especialidad
  const prosForService = professionals.filter(p => p.services.includes(servicioId));

  // Solo mostrar centros que tengan al menos un doctor con la especialidad seleccionada
  let centersOffering = centers.filter(center => {
    return prosForService.some(p => p.centerId === center.id);
  });
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    centersOffering = centersOffering.filter(c =>
      c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
    );
  }

  const prosByCenter = (cid: string) =>
    prosForService.filter(p => p.centerId === cid);

  // Guardar centros y profesionales en window.wizardData para el paso de confirmación
  React.useEffect(() => {
    const wizardData = (window as any).wizardData || {};
    wizardData.centros = centers;
    wizardData.profesionales = professionals;
    (window as any).wizardData = wizardData;
  }, [centers, professionals]);

  return (
    <>
    <div className="max-w-2xl mx-auto p-6 rounded-2xl border bg-white mt-8">
      <h2 className="text-xl font-semibold mb-4">Selecciona centro y profesional</h2>
      <input
        type="text"
        className="w-full rounded-xl border px-3 py-2 mb-4"
        placeholder="Buscar centro, ciudad o dirección..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {loading ? (
        <div className="text-gray-500">Cargando centros y profesionales...</div>
      ) : (
        <ul className="mb-6">
          {centersOffering.map(center => (
            <li key={center.id} className="mb-4">
              <div className="font-medium mb-1">{center.name}</div>
              <div className="text-xs text-gray-500 mb-1">{center.city} — {center.address}</div>
              <ul className="ml-4">
                {prosByCenter(center.id).map(prof => (
                  <li key={prof.id}>
                    <button
                      className={`rounded-xl border px-4 py-2 mb-2 w-full text-left hover:bg-gray-100 ${selectedProfessional === prof.id && selectedCenter === center.id ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => { setSelectedCenter(center.id); setSelectedProfessional(prof.id); }}
                    >
                      {prof.name}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-3">
        <button onClick={onBack} className="text-sm underline">&lt; Volver</button>
        <button
          className={`rounded-xl px-5 py-2 ${!selectedCenter || !selectedProfessional ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white'}`}
          disabled={!selectedCenter || !selectedProfessional}
          onClick={() => {
            if (!selectedCenter || !selectedProfessional) {
              setError("Debes seleccionar un centro y un profesional antes de continuar.");
              return;
            }
            setError(null);
            onNext({ centroId: selectedCenter, profesionalId: selectedProfessional });
          }}
        >Siguiente</button>
      </div>
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
    </div>
    </>
  );
}
