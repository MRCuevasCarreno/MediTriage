import { useState } from "react";
import Paso1Identificacion, { FoundPatient } from "./steps/Paso1Identificacion";

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
    setData(prev => ({ ...prev, ...partial }));
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

      {/* Contenido del paso */}
      {step === 0 && (
        <Paso1Identificacion onNext={({ rut, patient, docType }) => next({ rut, patient, docType })} />
      )}

      {step > 0 && (
        <div className="mt-4 flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={back} className="text-sm underline">&lt; Volver</button>
          <span className="text-xs text-gray-500">Paso {step+1} de {steps.length}</span>
        </div>
      )}
    </main>
  );
}
