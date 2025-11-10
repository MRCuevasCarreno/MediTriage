// src/utils/time.ts

/** Normaliza Date o string ISO a Date (zona local del navegador). */
export function toLocalDate(input: Date | string): Date {
  return typeof input === "string" ? new Date(input) : new Date(input);
}

/** Verdadero si a y b son el mismo día (zona local). */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Une fecha (Date) con hora HH:mm (ej. "15:30") en zona local. */
export function mergeDateAndTime(dateInput: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(
    dateInput.getFullYear(),
    dateInput.getMonth(),
    dateInput.getDate(),
    h, m, 0, 0
  );
}

/** Filtra horas (HH:mm) para no mostrar pasadas cuando el día seleccionado es hoy. */
export function filterTimesForToday(times: string[], selectedDate: Date): string[] {
  const now = new Date();
  if (!isSameLocalDay(selectedDate, now)) return times;
  return times.filter(t => mergeDateAndTime(selectedDate, t).getTime() >= now.getTime());
}

/** ===== Variante ISO ===== */

export type Slot = { id: string; start: string; end: string };

/** Filtra slots ISO del mismo día; si es hoy, descarta los que ya pasaron. */
export function filterIsoSlotsForToday(slots: Slot[], selectedDate: Date): Slot[] {
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const sameDaySlots = slots.filter(s => sameDay(new Date(s.start), selectedDate));
  const now = new Date();
  const isToday = sameDay(selectedDate, now);

  return isToday
    ? sameDaySlots.filter(s => new Date(s.start).getTime() >= now.getTime())
    : sameDaySlots;
}

/** Formatea un ISO a etiqueta HH:mm en zona local. */
export function hhmmFromISO(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
