import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { baseURL } from "../lib/api";
import { formatRut } from "../Utils/rut";

export function DoctorCalendar({ doctorId }: { doctorId: number }) {
  const { token } = useAuth();
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${baseURL}/api/Doctors/calendar`, {
          method: "POST",
          headers,
          body: JSON.stringify({ id: doctorId, date }),
        });

        if (!res.ok) throw new Error("Error al cargar el calendario.");

        const data = await res.json();

        // backend: { data: { appointmentsNotAvalable: [...], appointmentsAvailable: [...] } }
        const notAvail =
          data?.data?.appointmentsNotAvalable &&
          Array.isArray(data.data.appointmentsNotAvalable)
            ? data.data.appointmentsNotAvalable
            : [];

        // Filtrar solo citas desde la hora actual en adelante
        const now = new Date();
        const filtered = notAvail.filter((appt: any) => {
          try {
            // appt.hour puede ser string ISO o formato HH:MM
            const hourStr = appt.hour || '';
            let apptDateTime: Date;
            
            if (hourStr.includes('T')) {
              // formato ISO completo
              apptDateTime = new Date(hourStr);
            } else if (hourStr.includes(':')) {
              // formato HH:MM - combinar con la fecha seleccionada
              const [hh, mm] = hourStr.split(':').map(Number);
              apptDateTime = new Date(date);
              apptDateTime.setHours(hh, mm, 0, 0);
            } else {
              // formato desconocido, mantener la cita
              return true;
            }
            
            return apptDateTime >= now;
          } catch {
            // si hay error parseando, mantener la cita
            return true;
          }
        });

        setAppointments(filtered);
        
        // Solo mostrar error si realmente no hay citas en la respuesta del calendario
        if (notAvail.length === 0) {
          setError("No tienes citas el día de hoy.");
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar el calendario.");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    if (doctorId && date) {
      fetchAppointments();
    }
  }, [doctorId, date, token]);

  async function cancelAppointment(appointmentId: number) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(
        `${baseURL}/api/Appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: 2 }),
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(txt || "No se pudo cancelar la cita");
        return;
      }

      setAppointments((appts) =>
        appts.filter((a) => a.appointmentID !== appointmentId)
      );
    } catch {
      alert("No se pudo cancelar la cita");
    }
  }

  // deduplicar por appointmentID
  const uniqueAppointments = [
    ...new Map(appointments.map((a) => [a.appointmentID, a])).values(),
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4 mt-6">
      <div className="flex gap-4 mb-4 items-center">
        <label>
          Fecha:
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          />
        </label>
      </div>

      {loading && <div>Cargando citas...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <ul className="divide-y">
        {!loading && !error && uniqueAppointments.length === 0 ? (
          <li className="py-2 text-gray-500">No hay citas para esta fecha.</li>
        ) : null}

        {uniqueAppointments.map((appt) => (
          <li
            key={appt.appointmentID}
            className="py-2 flex justify-between items-center"
          >
            <div>
              <strong>
                {(() => {
                  // Mostrar la hora tal cual viene en el API (no convertir a zona local)
                  try {
                    const h = appt.hour;
                    if (typeof h === 'string') {
                      const t = h.indexOf('T');
                      if (t !== -1) {
                        // formato ISO: YYYY-MM-DDTHH:MM:SSZ -> extraer HH:MM
                        return h.substring(t + 1, t + 6);
                      }
                      // si no es ISO pero contiene hora, tomar los primeros 5 caracteres HH:MM
                      if (h.includes(':')) return h.slice(0, 5);
                    }
                    return String(h);
                  } catch {
                    return String(appt.hour ?? '');
                  }
                })()}
              </strong>
              <div className="text-sm text-gray-600 mt-1">
                {/* Nombre del paciente */}
                <div>
                  <b>Nombre de Paciente:</b> {appt.fullNamePatient || appt.patientName || '-'}
                </div>
                {/* Mostrar RUT formateado si existe */}
                <div>
                  <b>RUT:</b>{' '}
                  {(() => {
                    const r = appt.rut || appt.patientRut || appt.patient?.rut || appt.patientRut || appt.patient?.document || '';
                    try {
                      if (!r) return '-';
                      return formatRut(String(r));
                    } catch {
                      return String(r || '-');
                    }
                  })()}
                </div>
                {/* Prioridad y notas */}
                <div>
                  <b>Prioridad:</b>{' '}
                  {(() => {
                    const p = appt.triageLevel ?? appt.priority ?? null;
                    if (!p) return '-';
                    const s = String(p).trim().toUpperCase();
                    if (s === 'LOW') return 'Baja';
                    if (s === 'MEDIUM') return 'Media';
                    if (s === 'HIGH') return 'Alta';
                    return p;
                  })()}
                </div>
                <div><b>Descripción:</b> {appt.triageNotes ?? appt.description ?? '-'}</div>
              </div>
            </div>
            <button
              className="bg-red-500 text-white px-3 py-1 rounded"
              onClick={() => cancelAppointment(appt.appointmentID)}
            >
              Cancelar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
