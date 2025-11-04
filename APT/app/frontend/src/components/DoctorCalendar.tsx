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

        // backend: { data: { appointmentsNotAvalable: [...], appointmentsAvailable: [...] } }
        const notAvail =
          data?.data?.appointmentsNotAvalable &&
          Array.isArray(data.data.appointmentsNotAvalable)
            ? data.data.appointmentsNotAvalable
            : [];

        setAppointments(notAvail);
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
                  try {
                    // si viene algo tipo "2025-11-02T15:00:00Z"
                    const d = new Date(appt.hour);
                    return d.toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } catch {
                    // si viene solo "15:00"
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
