/** Application timezone — "today" always means today in Asia/Kolkata. */
export const IST = 'Asia/Kolkata';

/** Today's date (YYYY-MM-DD) in IST. */
export function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date());
}

/** Current wall-clock parts in IST. */
export function nowIST(): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}
