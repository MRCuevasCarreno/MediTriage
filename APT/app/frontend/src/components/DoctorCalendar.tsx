import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function DoctorCalendar({ doctorId }: { doctorId: number }) {
  const { token } = useAuth();
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setError(null);
      console.log('DoctorCalendar API id enviado:', doctorId);
      try {
        const res = await fetch('https://localhost:7290/api/Doctors/calendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ id: doctorId, date })
        });
        if (!res.ok) throw new Error('Error al cargar citas');
        const data = await res.json();
        // Espera formato { data: { appointmentsNotAvalable: [...] } }
        if (!data?.data?.appointmentsNotAvalable || !Array.isArray(data.data.appointmentsNotAvalable)) {
          setAppointments([]);
          setError('La respuesta del API no contiene citas no disponibles.');
          return;
        }
        setAppointments(data.data.appointmentsNotAvalable);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, [doctorId, date, token]);

  async function cancelAppointment(appointmentId: number) {
    try {
      await fetch(`https://localhost:7290/api/Appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 2 })
      });
      setAppointments(appts => appts.filter(a => a.appointmentID !== appointmentId));
    } catch {
      alert('No se pudo cancelar la cita');
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 mt-6">
      <div className="flex gap-4 mb-4 items-center">
        <label>Fecha:
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={date}
            onChange={e => setDate(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          />
        </label>
      </div>
      {loading ? <div>Cargando citas...</div> : null}
      {error ? <div className="text-red-600">{error}</div> : null}
      <ul className="divide-y">
        {appointments.length === 0 && !loading ? <li>No hay citas para esta fecha.</li> : null}
        {[...new Map(appointments.map(a => [a.appointmentID, a])).values()].map((appt) => (
          <li key={appt.appointmentID} className="py-2 flex justify-between items-center">
            <div>
              <strong>{new Date(appt.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
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
