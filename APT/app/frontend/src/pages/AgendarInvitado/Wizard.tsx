import { useState } from "react";
import Paso1Identificacion from "./steps/Paso1Indentificacion";
import Paso2Servicios from "./steps/Paso2Servicios";
import Paso3CentroProfesional from "./steps/Paso3CentroProfesional";
import Paso4DiayHora from "./steps/Paso4DiayHora";
import Paso5Confirmacion from "./steps/Paso5Confirmacion";
import type { FoundPatient } from "./steps/Paso1Indentificacion";

type BookingState = {
  docType?: "RUT" | "PASAPORTE";
  rut?: string;
  patient?: FoundPatient;
  servicioId?: string;
  centroId?: string;
  profesionalId?: string;
  fechaHora?: string;
  contacto?: { nombre?: string; email?: string; phone?: string };
};

const steps = ["Identificación", "Servicio", "Centro/Profesional", "Día y hora", "Confirmación"];

export default function WizardAgendarInvitado() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BookingState>({});

  function next(partial: Partial<BookingState> = {}) {
    setData(prev => {
      const newData = { ...prev, ...partial };
      // Exponer el estado global para los steps (simulación)
      (window as any).wizardData = newData;
      return newData;
    });
    setStep(s => Math.min(s + 1, steps.length - 1));
  }
  function back() { setStep(s => Math.max(s - 1, 0)); }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Stepper */}
      <ol className="flex items-center justify-between mb-6">
        {steps.map((label, i) => (
          <li key={i} className="flex-1">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center
                               ${i<=step ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}>
                {i+1}
              </div>
              <span className={`text-sm ${i===step ? "font-semibold" : "text-gray-500"}`}>{label}</span>
            </div>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Paso1Identificacion onNext={({ rut, patient, docType }) => next({ rut, patient, docType })} />
      )}
      {step === 1 && (
        <Paso2Servicios onNext={({ servicioId }) => next({ servicioId })} onBack={back} />
      )}
      {step === 2 && (
        <Paso3CentroProfesional onNext={({ centroId, profesionalId }) => next({ centroId, profesionalId })} onBack={back} />
      )}
      {step === 3 && (
        <Paso4DiayHora onNext={({ fechaHora }) => next({ fechaHora })} onBack={back} />
      )}
      {step === 4 && (
        <Paso5Confirmacion data={data} onBack={back} />
      )}
    </main>
  );
}
