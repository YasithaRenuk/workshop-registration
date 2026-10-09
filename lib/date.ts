const pad = (n: number) => String(n).padStart(2, "0");

export function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isoToDateInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : toDateInput(d);
}

// "2026-10-12" -> local midnight, as a UTC ISO string
export const startOfDayISO = (date: string) =>
  new Date(`${date}T00:00:00`).toISOString();

export const endOfDayISO = (date: string) =>
  new Date(`${date}T23:59:59.999`).toISOString();

export function presetRange(kind: "today" | "week" | "next7") {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  // "This week" = today through Sunday
  if (kind === "week") end.setDate(start.getDate() + ((7 - start.getDay()) % 7));
  if (kind === "next7") end.setDate(start.getDate() + 6);
  return {
    from: startOfDayISO(toDateInput(start)),
    to: endOfDayISO(toDateInput(end)),
  };
}

export function toDateTimeLocal(v: string | Date | null | undefined) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
