/** ISO week id, e.g. 2026-W26 */
export function getIsoWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getWeekRange(date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export function formatWeekRange(date = new Date(), locale = "en"): string {
  const { start, end } = getWeekRange(date);
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
