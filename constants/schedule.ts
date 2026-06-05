// Hair-care cadence. JS getDay(): Sun=0 … Sat=6
export const SHAMPOO_DAYS = [2, 4, 0]; // Tue, Thu, Sun
export const MICRONEEDLE_DAYS = [3, 5, 1]; // Wed, Fri, Mon (day after each shampoo)

// Weekday (0–6) for a local-time "YYYY-MM-DD" key — parsed component-wise so the
// key is never reinterpreted as UTC midnight.
function weekday(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function isShampooDay(dateKey: string): boolean {
  return SHAMPOO_DAYS.includes(weekday(dateKey));
}

export function isMicroneedleDay(dateKey: string): boolean {
  return MICRONEEDLE_DAYS.includes(weekday(dateKey));
}
