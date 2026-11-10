// lib/dateRanges.ts  (pure functions, named exports)
export function startOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
export function endOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x;
}
export function startOfYesterday(d = new Date()) {
  const x = startOfDay(d); x.setDate(x.getDate() - 1); return x;
}
export function endOfYesterday(d = new Date()) {
  const x = endOfDay(d); x.setDate(x.getDate() - 1); return x;
}
// ISO week: Monday–Sunday
export function startOfWeek(d = new Date()) {
  const x = startOfDay(d); const day = x.getDay(); const diff = (day === 0 ? -6 : 1 - day);
  x.setDate(x.getDate() + diff); return x;
}
export function endOfWeek(d = new Date()) {
  const x = startOfWeek(d); x.setDate(x.getDate() + 6); x.setHours(23, 59, 59, 999); return x;
}
export function startOfMonth(d = new Date()) {
  const x = startOfDay(d); x.setDate(1); return x;
}
export function endOfMonth(d = new Date()) {
  const x = startOfMonth(d); x.setMonth(x.getMonth() + 1); x.setDate(0); x.setHours(23, 59, 59, 999); return x;
}
