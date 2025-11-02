import React from "react";
import { useNavigate } from "react-router-dom";
import { formatRut } from "../../../Utils/rut";
import { baseURL } from "../../../lib/api";

export default function Paso5Confirmacion({
  data,
  onBack,
}: {
  data: any;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [apiError, setApiError] = React.useState<string>("");
  const [email, setEmail] = React.useState("");
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [emailError, setEmailError] = React.useState("");

  function validateEmail(val: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
  }

  React.useEffect(() => {
    if (!email && emailTouched) setEmailError("El email es requerido");
    else if (email && !validateEmail(email)) setEmailError("Formato de email inválido");
    else setEmailError("");
  }, [email, emailTouched]);

  // Diccionario de especialidades
  const especialidades = {
    "med-gen": "Medicina General",
    derm: "Dermatología",
    cardio: "Cardiología",
    pedi: "Pediatría",
    kine: "Kinesiología",
    tele: "Telemedicina",
  };

  // Obtener nombres de centro y profesional desde los datos seleccionados
  let centroNombre = "—";
  let profesionalNombre = "—";
  const wizardData = (window as any).wizardData || {};

  // Buscar en los arrays de centros y profesionales si existen
  if (wizardData.centroId && Array.isArray(wizardData.centros)) {
    const centro = wizardData.centros.find(
      (c: any) => String(c.id) === String(wizardData.centroId)
    );
    if (centro) centroNombre = centro.name;
  }
  if (wizardData.profesionalId && Array.isArray(wizardData.profesionales)) {
    const prof = wizardData.profesionales.find(
      (p: any) => String(p.id) === String(wizardData.profesionalId)
    );
    if (prof) profesionalNombre = prof.name;
  }

  // Si no se encuentran, mostrar el ID como fallback
  if (centroNombre === "—" && data.centroId) centroNombre = data.centroId;
  if (profesionalNombre === "—" && data.profesionalId) profesionalNombre = data.profesionalId;

  // Formatear fecha y hora
  function formatFechaHora(fechaHora?: string) {
    if (!fechaHora) return "—";
    const [fecha, hora] = fechaHora.split("T");
    const [y, m, d] = fecha.split("-");
    return `${d}-${m}-${y} a las ${hora}hrs`;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl border bg-white mt-8">
      <h2 className="text-xl font-semibold mb-4">Confirmación de reserva</h2>
      <div className="mb-6">
        <ul className="text-sm space-y-2">
          <li>
            <b>RUT:</b> {data.rut ? formatRut(data.rut) : "—"}
          </li>
          <li>
            <b>Especialidad:</b>{" "}
            {especialidades[String(data.servicioId) as keyof typeof especialidades] || "—"}
          </li>
          <li>
            <b>Centro:</b> {centroNombre}
          </li>
          <li>
            <b>Profesional:</b> {profesionalNombre}
          </li>
          <li>
            <b>Fecha y hora:</b> {formatFechaHora(data.fechaHora)}
          </li>
        </ul>
      </div>

      {apiError && <div className="text-red-600 text-xs mb-2">{apiError}</div>}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Ingrese su mail para recibir su comprobante de reserva"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
        />
        {emailError && <div className="text-red-600 text-xs mt-1">{emailError}</div>}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="text-sm underline">
          &lt; Volver
        </button>
        <button
          className="rounded-xl bg-black text-white px-5 py-2"
          disabled={!!emailError || !email}
          onClick={async () => {
            setApiError("");

            // Preparar datos para API
            const fullName = data.patient?.name || "Paciente Invitado";
            const doctorId = data.profesionalId;

            // Formato: YYYY-MM-DDTHH:mm:ss
            let start = data.fechaHora as string | undefined;
            let end = "";

            if (start) {
              const d = new Date(start);
              // Sumar 29 minutos y 59 segundos
              d.setMinutes(d.getMinutes() + 29);
              d.setSeconds(59);

              const pad = (n: number) => n.toString().padStart(2, "0");
              const format = (date: Date) =>
                `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
                  date.getDate()
                )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
                  date.getSeconds()
                )}`;

              end = format(d);

              const dStart = new Date(start);
              start = format(dStart);
            }

            const payload = {
              fullName,
              email,
              doctorId,
              start,
              end,
              triageLevel: "MEDIUM",
              triageNotes: "Dolor leve",
            };

            try {
              console.log("API Request:", payload);

              // intentar leer token
              const token =
                localStorage.getItem("authToken") || localStorage.getItem("token") || "";

              const headers: Record<string, string> = {
                accept: "application/json, text/plain, */*",
                "Content-Type": "application/json",
              };
              if (token) {
                headers.Authorization = `Bearer ${token}`;
              }

              const response = await fetch(`${baseURL}/api/Appointments/public`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
              });

              let result: any = null;
              try {
                result = await response.json();
              } catch {
                // por si la API devuelve texto
                result = null;
              }

              // éxito típico de tu backend
              if (
                response.ok &&
                (result?.message?.includes("Cita creada") ||
                  result?.message?.includes("Appointment") ||
                  result?.success)
              ) {
                const confirmacionData = {
                  ...data,
                  email,
                  start,
                  end,
                  centroNombre,
                  profesionalNombre,
                  api: result,
                };
                navigate("/confirmacion-cita", { state: { data: confirmacionData } });
              } else {
                setApiError(
                  `Error ${response.status}: ${result?.message || "No se pudo crear la cita"}`
                );
              }
            } catch (err: any) {
              setApiError(`Error: ${err?.message || "Error desconocido"}`);
            }
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
