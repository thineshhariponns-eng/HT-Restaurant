const RUPEES = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const CLOCK = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

/** ₹ sits tight against the figure, Indian digit grouping: ₹1,24,500. */
export function formatRupees(amount: number): string {
  return `₹${RUPEES.format(amount)}`;
}

export function formatClock(iso: string): string {
  return CLOCK.format(new Date(iso)).replace(/\s?(am|pm)$/i, (m) => ` ${m.trim().toLowerCase()}`);
}

/** Elapsed time as "4 min" or "1 h 12 min". */
export function formatElapsed(fromIso: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function minutesSince(fromIso: string, now: number): number {
  return Math.floor((now - new Date(fromIso).getTime()) / 60_000);
}
