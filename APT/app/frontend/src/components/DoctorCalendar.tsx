import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { baseURL } from "../lib/api";

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
      console.log("DoctorCalendar API id enviado:", doctorId);

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

        if (!res.ok) throw new Error("Error al cargar citas");

        const data = await res.json();

        // El backend tuyo manda algo como:
        // { data: { appointmentsNotAvalable: [...], appointmentsAvailable: [...] } }
        const notAvail =
          data?.data?.appointmentsNotAvalable && Array.isArray(data.data.appointmentsNotAvalable)
            ? data.data.appointmentsNotAvalable
            : [];

        setAppointments(notAvail);
        if (!notAvail.length) {
          setError("No hay citas no disponibles para esta fecha.");
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar citas");
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

      const res = await fetch(`${baseURL}/api/Appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: 2 }),
      });

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

  // deduplicar por appointmentID (tú ya lo hacías)
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

      {loading ? <div>Cargando citas...</div> : null}
      {error ? <div className="text-red-600">{error}</div> : null}

      <ul className="divide-y">
        {uniqueAppointments.length === 0 && !loading ? (
          <li>No hay citas para esta fecha.</li>
        ) : null}

        {uniqueAppointments.map((appt) => (
          <li
            key={appt.appointmentID}
            className="py-2 flex justify-between items-center"
          >
            <div>
              <strong>
                {(() => {
                  try {
                    // Muestra la hora que llega sin cambiar zona
                    const utcDate = new Date(appt.hour);
                    return utcDate.toISOString().slice(11, 16);
                  } catch {
                    return appt.hour;
                  }
                })()}
              </strong>
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
