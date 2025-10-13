import NavBar from '../../../components/NavBar';
import React from "react";
import { useNavigate } from "react-router-dom";
import { formatRut } from "../../../Utils/rut";

export default function Paso5Confirmacion({ data, onBack }: { data: any, onBack: () => void }) {
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
        "derm": "Dermatología",
        "cardio": "Cardiología",
        "pedi": "Pediatría",
        "kine": "Kinesiología",
        "tele": "Telemedicina"
    };

    // Obtener nombres de centro y profesional desde los datos seleccionados
    let centroNombre = "—";
    let profesionalNombre = "—";
    const wizardData = (window as any).wizardData || {};
    // Buscar en los arrays de centros y profesionales si existen
    if (wizardData.centroId && Array.isArray(wizardData.centros)) {
        const centro = wizardData.centros.find((c: any) => String(c.id) === String(wizardData.centroId));
        if (centro) centroNombre = centro.name;
    }
    if (wizardData.profesionalId && Array.isArray(wizardData.profesionales)) {
        const prof = wizardData.profesionales.find((p: any) => String(p.id) === String(wizardData.profesionalId));
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
        <>
            <NavBar />
            <div className="max-w-2xl mx-auto p-6 rounded-2xl border bg-white mt-8">
                <h2 className="text-xl font-semibold mb-4">Confirmación de reserva</h2>
                <div className="mb-6">
                    <ul className="text-sm space-y-2">
                        <li><b>RUT:</b> {data.rut ? formatRut(data.rut) : "—"}</li>
                        <li><b>Especialidad:</b> {especialidades[String(data.servicioId) as keyof typeof especialidades] || "—"}</li>
                        <li><b>Centro:</b> {centroNombre}</li>
                        <li><b>Profesional:</b> {profesionalNombre}</li>
                        <li><b>Fecha y hora:</b> {formatFechaHora(data.fechaHora)}</li>
                    </ul>
                </div>
                {apiError && <div className="text-red-600 text-xs mb-2">{apiError}</div>}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Ingrese su mail para recibir su comprobante de reserva"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onBlur={() => setEmailTouched(true)}
                    />
                    {emailError && <div className="text-red-600 text-xs mt-1">{emailError}</div>}
                </div>
                <div className="flex gap-3">
                    <button onClick={onBack} className="text-sm underline">&lt; Volver</button>
                    <button
                        className="rounded-xl bg-black text-white px-5 py-2"
                        disabled={!!emailError || !email}
                        onClick={async () => {
                            setApiError("");
                            // Preparar datos para API
                            const fullName = data.patient?.name || "Paciente Invitado";
                            const doctorId = data.profesionalId;
                            // Formato: YYYY-MM-DDTHH:mm:ss
                            let start = data.fechaHora;
                            let end = "";
                            if (start) {
                                const d = new Date(start);
                                // Sumar 29 minutos y 59 segundos
                                d.setMinutes(d.getMinutes() + 29);
                                d.setSeconds(59);
                                // Formatear ambos campos igual que el ejemplo
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                const format = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
                                end = format(d);
                                // start también debe estar en ese formato
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
                                triageNotes: "Dolor leve"
                            };
                            try {
                                console.log("API Request:", payload);
                                const response = await fetch("https://localhost:7290/api/Appointments/public", {
                                    method: "POST",
                                    headers: {
                                        accept: "text/plain",
                                        "Content-Type": "application/json",
                                        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDMiLCJlbWFpbCI6ImFkbWluQGFkbWluLmNsIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6IkFkbWluIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiQWRtaW4iLCJleHAiOjE3NjAzODUwNjUsImlzcyI6Ik1lZGlUcmlhZ2UiLCJhdWQiOiJNZWRpVHJpYWdlIn0.Hw7Xevm3nzA_ndoFkF02xIgHCUgxXfy3eikRaCIyHLg"
                                    },
                                    body: JSON.stringify(payload)
                                });
                                const result = await response.json();
                                console.log("API Response:", result);
                                if (result?.message && result.message.includes("Cita creada")) {
                                    // Guardar datos para la página de confirmación
                                    const confirmacionData = {
                                        ...data,
                                        email,
                                        start,
                                        end,
                                        centroNombre,
                                        profesionalNombre,
                                        api: result
                                    };
                                    navigate("/confirmacion-cita", { state: { data: confirmacionData } });
                                } else {
                                    setApiError(`Error ${response.status}: ${result?.message || "Error desconocido"}`);
                                }
                            } catch (err: any) {
                                setApiError(`Error: ${err?.message || "Error desconocido"}`);
                            }
                        }}
                    >Confirmar</button>
                </div>
            </div>
        </>
    );
}
