import React from "react";

export default function Paso2Servicios({ onNext, onBack }: { onNext: (data: { servicioId: string }) => void, onBack: () => void }) {
  const servicios = [
    { id: "med-gen", name: "Medicina General", description: "Consulta integral, primera evaluación.", icon: "🩺" },
    { id: "derm",    name: "Dermatología",      description: "Piel, uñas y cabello.",                 icon: "🌤️" },
    { id: "cardio",  name: "Cardiología",       description: "Corazón y sistema cardiovascular.",     icon: "❤️" },
    { id: "pedi",    name: "Pediatría",         description: "Salud infantil y controles.",           icon: "🧸" },
    { id: "kine",    name: "Kinesiología",      description: "Rehabilitación y terapia física.",      icon: "🏃" },
    { id: "tele",    name: "Telemedicina",      description: "Atención en línea.",                    icon: "💻" },
  ];
  const [selected, setSelected] = React.useState<string>("");
  const [edad, setEdad] = React.useState<number | "">("");
  const [fiebre, setFiebre] = React.useState<boolean>(false);
  const [temperatura, setTemperatura] = React.useState<number | "">("");
  const [dolor, setDolor] = React.useState<number>(5);
  const [notas, setNotas] = React.useState<string>("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiAlert, setAiAlert] = React.useState<string | null>(null);
  const [aiResult, setAiResult] = React.useState<{ level: string; specialist: string; redFlag: boolean } | null>(null);

  function mapLevelToApi(level: string) {
    if (!level) return 'MEDIUM';
    const s = level.toLowerCase();
    if (s.includes('alto') || s.includes('high')) return 'HIGH';
    if (s.includes('bajo') || s.includes('low')) return 'LOW';
    if (s.includes('medio') || s.includes('medium')) return 'MEDIUM';
    return 'MEDIUM';
  }

  const canProceed = Boolean(selected) || (edad !== "" && notas.trim() !== "" && dolor >= 1 && dolor <= 10);
  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl border bg-white mt-8">
      <div className="mb-4 p-4 rounded-lg bg-gray-50 border">
        <p className="font-medium">¿ No estás seguro ? Utiliza nuestra inteligencia Artificial para orientarte.</p>
        <p className="text-sm text-gray-600 mt-2">Nuestra IA puede sugerir el servicio más adecuado según tus síntomas.</p>
      </div>

      <div className="mb-6 p-4 rounded-lg border bg-white">
        <h3 className="font-semibold mb-3">Triage orientativo</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-sm">
            Edad
            <input
              type="number"
              min={0}
              value={edad}
              onChange={(e) => setEdad(e.target.value ? Number(e.target.value) : "")}
              className="mt-1 block w-full rounded border px-2 py-1"
            />
          </label>

          <label className="text-sm">
            <div className="flex items-center gap-2">
              <span>Fiebre</span>
              <input type="checkbox" checked={fiebre} onChange={(e) => setFiebre(e.target.checked)} className="ml-2" />
            </div>
            {fiebre && (
              <input
                type="number"
                step="0.1"
                min={30}
                max={45}
                placeholder="Temperatura °C"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value ? Number(e.target.value) : "")}
                className="mt-2 block w-full rounded border px-2 py-1"
              />
            )}
          </label>

          <label className="text-sm">
            Dolor (1-10)
            <input
              type="range"
              min={1}
              max={10}
              value={dolor}
              onChange={(e) => setDolor(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <div className="text-xs text-gray-600">{dolor}</div>
          </label>

          <label className="text-sm md:col-span-4">
            Notas
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="mt-1 block w-full rounded border px-2 py-1"
            />
          </label>
          <div className="md:col-span-4 mt-2">
            <button
              type="button"
              onClick={async () => {
                setAiAlert(null);
                setAiResult(null);
                setAiLoading(true);
                try {
                  const body = { age: typeof edad === 'number' ? edad : (edad === '' ? null : Number(edad)), fever: fiebre, pain: dolor, notes: notas };
                  const res = await fetch('https://localhost:7290/api/ai/triage', {
                    method: 'POST',
                    headers: { 'Accept': 'text/plain', 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                  });
                  if (!res.ok) throw new Error(`AI triage request failed: ${res.status}`);
                  const text = await res.text();
                  // The API returns plain text but with JSON structure — try parse
                  let parsed: any;
                  try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
                  if (!parsed || !parsed.data) throw new Error('Respuesta inválida de AI');
                  const { level, specialist, redFlag } = parsed.data;
                  setAiResult({ level, specialist, redFlag });
                  if (redFlag) {
                    setAiAlert('¡Alerta!: Resultado indicaría una situación seria. Diríjase a urgencias lo antes posible.');
                  } else {
                    // Normalizar nivel al formato esperado por la API y guardar en localStorage + wizardData
                    const mapped = mapLevelToApi(level || '');
                    try {
                      localStorage.setItem('triage_level', mapped);
                      localStorage.setItem('triage_specialist', specialist || '');
                      localStorage.setItem('triage_notes', notas || '');
                    } catch (e) {
                      // ignore
                    }
                    try {
                      const wd = (window as any).wizardData || {};
                      wd.triageLevel = mapped;
                      wd.triageNotes = notas || '';
                      wd.triageAge = typeof edad === 'number' ? edad : (edad === '' ? null : Number(edad));
                      wd.triagePain = dolor;
                      wd.triageFever = fiebre;
                      (window as any).wizardData = wd;
                    } catch {}
                  }
                } catch (err: any) {
                  setAiAlert('Error al consultar la IA: ' + (err?.message || err));
                } finally {
                  setAiLoading(false);
                }
              }}
              className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
              disabled={aiLoading}
            >
              {aiLoading ? 'Consultando IA...' : 'Orientarme con IA'}
            </button>

            {aiAlert && (
              <div className="mt-3 p-3 rounded bg-red-50 text-red-800">{aiAlert}</div>
            )}

            {aiResult && !aiResult.redFlag && (
              <div className="mt-3 p-3 rounded bg-green-50 text-green-800">
                <div><strong>Nivel:</strong> {aiResult.level}</div>
                <div><strong>Especialidad sugerida:</strong> {aiResult.specialist}</div>
                <div className="mt-3">
                  <button
                    type="button"
                    className="rounded-md bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                    onClick={() => {
                      // Map speciality text to servicioId used in wizard
                      const spec = (aiResult.specialist || '').toLowerCase();
                      let servicioMap = 'med-gen';
                      if (spec.includes('medicina')) servicioMap = 'med-gen';
                      else if (spec.includes('dermat')) servicioMap = 'derm';
                      else if (spec.includes('cardio')) servicioMap = 'cardio';
                      else if (spec.includes('pediatr')) servicioMap = 'pedi';
                      else if (spec.includes('kinesi') || spec.includes('kine')) servicioMap = 'kine';
                      else if (spec.includes('tele')) servicioMap = 'tele';

                      // save in wizardData and advance to next step (Centro/Profesional)
                        const wizardData = (window as any).wizardData || {};
                        wizardData.servicioId = servicioMap;
                        // ensure triage data saved
                        wizardData.triageLevel = wizardData.triageLevel || localStorage.getItem('triage_level') || mapLevelToApi(aiResult?.level || '');
                        wizardData.triageNotes = wizardData.triageNotes || localStorage.getItem('triage_notes') || notas || '';
                        wizardData.triageAge = wizardData.triageAge || (typeof edad === 'number' ? edad : (edad === '' ? null : Number(edad)));
                        wizardData.triagePain = wizardData.triagePain || dolor;
                        wizardData.triageFever = wizardData.triageFever || fiebre;
                        (window as any).wizardData = wizardData;
                        // use onNext to advance step in Wizard and pass servicioId
                        onNext({ servicioId: servicioMap });
                    }}
                  >Ver sucursales disponibles</button>
                </div>
              </div>
            )}

            
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Selecciona el servicio</h2>
      <ul className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {servicios.map(servicio => (
          <li key={servicio.id}>
            <button
              className={`w-full rounded-xl border px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 ${selected === servicio.id ? 'border-blue-500 bg-blue-50' : ''}`}
              onClick={() => setSelected(servicio.id)}
            >
              <span className="text-2xl mr-2">{servicio.icon}</span>
              <span className="font-semibold">{servicio.name}</span>
              <span className="ml-2 text-xs text-gray-500">{servicio.description}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-3">
        <button onClick={onBack} className="text-sm underline">&lt; Volver</button>
        <button
          className={`rounded-xl px-5 py-2 ${canProceed ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}
          disabled={!canProceed}
          onClick={() => {
            if (!canProceed) return;
            // persist triage data to wizardData before advancing
            try {
              const wizardData = (window as any).wizardData || {};
              wizardData.triageLevel = wizardData.triageLevel || localStorage.getItem('triage_level') || mapLevelToApi(aiResult?.level || '');
              wizardData.triageNotes = wizardData.triageNotes || localStorage.getItem('triage_notes') || notas || '';
              wizardData.triageAge = wizardData.triageAge || (typeof edad === 'number' ? edad : (edad === '' ? null : Number(edad)));
              wizardData.triagePain = wizardData.triagePain || dolor;
              wizardData.triageFever = wizardData.triageFever || fiebre;
              (window as any).wizardData = wizardData;
            } catch {}
            onNext({ servicioId: selected || '' });
          }}
        >Siguiente</button>
      </div>

      <p className="mt-6 text-xs text-gray-500">Nota importante: La orientación entregada por el sistema no constituye un diagnóstico médico. El módulo de IA es únicamente informativo y debe ser complementado siempre con la evaluación de un profesional de la salud.</p>
    </div>
  );
}
