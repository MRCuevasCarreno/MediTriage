import React from "react";
import NavBar from '../../../components/NavBar';

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
  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl border bg-white mt-8">
      <NavBar />
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
          className="rounded-xl bg-black text-white px-5 py-2"
          disabled={!selected}
          onClick={() => selected && onNext({ servicioId: selected })}
        >Siguiente</button>
      </div>
    </div>
  );
}
