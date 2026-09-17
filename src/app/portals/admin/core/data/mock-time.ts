/** Mock timestamps are anchored to page load so the sample service always looks like "tonight". */
const LOADED_AT = Date.now();

export function minutesAgo(minutes: number): string {
  return new Date(LOADED_AT - minutes * 60_000).toISOString();
}
