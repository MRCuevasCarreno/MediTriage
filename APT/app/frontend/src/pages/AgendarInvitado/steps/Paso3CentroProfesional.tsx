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
  const [comunaFilter, setComunaFilter] = useState<string>('');
  const [especialidadFilter, setEspecialidadFilter] = useState<string>('');
  const [availableComunas, setAvailableComunas] = useState<string[]>([]);
  const [availableEspecialidades] = useState<Array<{ id: string; label: string; apiName: string }>>([
    { id: 'all', label: 'Todas', apiName: '' },
    { id: 'med-gen', label: 'Medicina General', apiName: 'Medicina' },
    { id: 'derm', label: 'Dermatología', apiName: 'Dermatología' },
    { id: 'cardio', label: 'Cardiología', apiName: 'Cardiología' },
    { id: 'pedi', label: 'Pediatría', apiName: 'Pediatría' },
    { id: 'kine', label: 'Kinesiología', apiName: 'Kinesiología' },
    { id: 'tele', label: 'Telemedicina', apiName: 'Telemedicina' },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string|null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string|null>(null);

  // Obtener especialidad seleccionada desde el wizard (si viene del triage)
  const initialServicioId = (window as any).wizardData?.servicioId || "";

  // Función para construir la URL de fetch con filtros
  const buildSucursalesUrl = (especialidadApiName?: string, comuna?: string) => {
    const base = 'https://localhost:7290/api/Sucursales';
    const params = new URLSearchParams();
    if (especialidadApiName) params.set('especialidad', especialidadApiName);
    if (comuna) params.set('comuna', comuna);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  // Cargar centros y profesionales desde API (dependiente de filtros)
  useEffect(() => {
    let isMounted = true;
    const cargar = async () => {
      setLoading(true);
      try {
        // map selected especialidadFilter (servicio id) to api name
        const esp = availableEspecialidades.find(e => e.id === especialidadFilter)?.apiName || '';
        const url = buildSucursalesUrl(esp || undefined, comunaFilter || undefined);
        const res = await fetch(url, {
          headers: {
            accept: 'application/json'
          }
        });
        if (!res.ok) throw new Error('Error API');
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          const apiCenters = json.data.map((c: any) => ({
            id: String(c.id),
            name: c.nombre,
            city: c.comuna,
            address: c.direccion
          }));
          if (!isMounted) return;
          setCenters(apiCenters);
          // populate available comunas from centers (for the comuna filter options)
          const comunas = Array.from(new Set(apiCenters.map((c: any) => String(c.city || '')).filter(Boolean))) as string[];
          comunas.sort();
          setAvailableComunas(comunas);

          // Mapear doctores a Professional[]
          const apiProfessionals = json.data.flatMap((c: any) =>
            (c.doctors || []).map((d: any) => ({
              id: String(d.id),
              name: d.user?.name || d.name,
              centerId: String(c.id),
              services: [
                d.specialty === 'Medicina General' ? 'med-gen' :
                d.specialty === 'Dermatología' ? 'derm' :
                d.specialty === 'Cardiología' ? 'cardio' :
                d.specialty === 'Pediatría' ? 'pedi' :
                d.specialty === 'Kinesiología' ? 'kine' :
                d.specialty === 'Telemedicina' ? 'tele' :
                d.specialty?.toLowerCase() || ''
              ]
            }))
          );
          setProfessionals(apiProfessionals);
        }
      } catch (e) {
        // ignore errors for now
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    cargar();
    return () => { isMounted = false; };
  }, [especialidadFilter, comunaFilter]);

  // Si initialServicioId viene del Paso 2 (triage), rellenar el filtro de especialidad al cargar
  useEffect(() => {
    if (initialServicioId) setEspecialidadFilter(initialServicioId);
  }, [initialServicioId]);

  // Filtrar profesionales por especialidad seleccionada
  const servicioId = (especialidadFilter && especialidadFilter !== 'all') ? especialidadFilter : (initialServicioId || '');
  const prosForService = servicioId ? professionals.filter(p => p.services.includes(servicioId)) : professionals;

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <select className="rounded-xl border px-3 py-2" value={especialidadFilter} onChange={e => setEspecialidadFilter(e.target.value)}>
          {availableEspecialidades.map(e => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>

        <select className="rounded-xl border px-3 py-2" value={comunaFilter} onChange={e => setComunaFilter(e.target.value)}>
          <option value="">Todas las comunas</option>
          {availableComunas.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="text"
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Buscar centro, ciudad o dirección..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
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
