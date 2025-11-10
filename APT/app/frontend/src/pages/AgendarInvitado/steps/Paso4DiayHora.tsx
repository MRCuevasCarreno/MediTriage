import React, { useEffect, useState } from "react";
import { baseURL } from "../../../lib/api";

export default function Paso4DiayHora({
  onNext,
  onBack,
}: {
  onNext: (data: { fechaHora: string }) => void;
  onBack: () => void;
}) {
  // ───────────────────────────────────────── Helpers ─────────────────────────────────────────
  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function plusDaysISO(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  /** Junta un YYYY-MM-DD con "HH:mm" y devuelve Date en zona local */
  function mergeDateAndTime(dateISO: string, hhmm: string): Date {
    const [h, m] = hhmm.split(":").map(Number);
    const [y, mo, da] = dateISO.split("-").map(Number);
    return new Date(y, (mo ?? 1) - 1, da ?? 1, h ?? 0, m ?? 0, 0, 0);
  }

  /** Oculta horas pasadas si el día seleccionado es hoy */
  function filterPastTimesForToday(
    slots: { time: string; label: string; disabled?: boolean }[],
    dateISO: string
  ) {
    const now = new Date();
    const isToday = dateISO === todayISO();
    if (!isToday) return slots;
    return slots.filter((s) => mergeDateAndTime(dateISO, s.time).getTime() >= now.getTime());
  }

  // ───────────────────────────────────── Datos del wizard ─────────────────────────────────────
  const wizardData = (window as any).wizardData || {};
  const doctorId = wizardData.profesionalId;

  // ─────────────────────────────────────────── Estado ─────────────────────────────────────────
  const [date, setDate] = useState<string>(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ time: string; label: string; disabled?: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─────────────────────────────────── Cargar horarios disponibles ────────────────────────────
  useEffect(() => {
    if (!date || !doctorId) {
      setSlots([]);
      return;
    }

    setLoading(true);

    // si tienes token guardado, lo mandamos
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token") || undefined;

    fetch(`${baseURL}/api/Doctors/calendar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id: Number(doctorId), date }), // date = "YYYY-MM-DD"
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("API calendar error");
        const api = await res.json();

        // Mapear a {time, label, disabled}
        const mapped: { time: string; label: string; disabled?: boolean }[] =
          (api.data?.appointmentsAvailable || []).map((slot: any) => {
            // startHour/finishHour se asumen ISO o "YYYY-MM-DDTHH:mm:ss"
            const startHHMM = slot.startHour.slice(11, 16);
            const finishHHMM = slot.finishHour.slice(11, 16);
            return {
              time: startHHMM,
              label: `${startHHMM} - ${finishHHMM}`,
              disabled: !slot.status,
            };
          });

        // Filtro: si es hoy, ocultar horas pasadas
        const filtered = filterPastTimesForToday(mapped, date);

        setSlots(filtered);
      })
      .catch(() => {
        // Si falla, usar datos simulados
        const simulated = [
          { time: "09:00", label: "09:00 - 09:30", disabled: false },
          { time: "09:30", label: "09:30 - 10:00", disabled: false },
          { time: "10:00", label: "10:00 - 10:30", disabled: false },
          { time: "10:30", label: "10:30 - 11:00", disabled: false },
          { time: "11:00", label: "11:00 - 11:30", disabled: false },
          { time: "15:00", label: "15:00 - 15:30", disabled: false },
        ];
        const filtered = filterPastTimesForToday(simulated, date);
        setSlots(filtered);
      })
      .finally(() => setLoading(false));
  }, [date, doctorId]);

  // ─────────────────────────── Guardar en wizard global (fechaHora ISO local) ───────────────────────────
  useEffect(() => {
    const wd = (window as any).wizardData || {};
    wd.fechaHora = date && selectedSlot ? `${date}T${selectedSlot}` : null;
    (window as any).wizardData = wd;
  }, [date, selectedSlot]);

  // ─────────────────────────────────────────── Render ─────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl border bg-white mt-8">
      <h2 className="text-xl font-semibold mb-4">Selecciona día y hora</h2>

      <div className="mb-4">
        <label className="text-sm font-medium">Fecha</label>
        <input
          type="date"
          className="w-full rounded-xl border px-3 py-2 mt-1"
          min={todayISO()}
          max={plusDaysISO(60)}
          value={date}
          onChange={(e) => {
            const selected = e.target.value;
            if (selected < todayISO()) {
              setError("No puede seleccionarse una fecha anterior a la de hoy");
              setDate(todayISO());
              setSelectedSlot(null);
              return;
            }
            setError(null);
            setDate(selected);
            setSelectedSlot(null);
          }}
        />
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium">Horarios disponibles</label>
        {loading ? (
          <div className="text-gray-500">Cargando horarios...</div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 mt-2">
            {slots.map((slot) => (
              <li key={`${date}-${slot.time}`}>
                <button
                  className={`w-full rounded-xl border px-3 py-2 text-center ${
                    selectedSlot === slot.time ? "border-blue-500 bg-blue-50" : ""
                  } ${slot.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                  disabled={slot.disabled}
                  onClick={() => setSelectedSlot(slot.time)}
                >
                  {slot.label}
                </button>
              </li>
            ))}
            {slots.length === 0 && !loading && (
              <li className="text-sm text-gray-500 col-span-2">
                No hay horarios disponibles para este día.
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <div className="flex gap-3">
        <button onClick={onBack} className="text-sm underline">
          &lt; Volver
        </button>
        <button
          className={`rounded-xl px-5 py-2 ${
            !date || !selectedSlot
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-black text-white"
          }`}
          disabled={!date || !selectedSlot}
          onClick={() => date && selectedSlot && onNext({ fechaHora: `${date}T${selectedSlot}` })}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
