/**
 * Date utilities using LOCAL year, month, and day to avoid timezone offsets.
 */

/**
 * Returns YYYY-MM-DD from LOCAL year/month/day (not toISOString)
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add or subtract days using local calendar arithmetic
 */
export function addDaysLocal(baseDate: Date | string, days: number): string {
  let d: Date;
  if (typeof baseDate === 'string') {
    const [year, month, day] = baseDate.split('-').map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  }
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/**
 * Difference in days between a target YYYY-MM-DD and a base date (target - base)
 */
export function getDaysDiffLocal(targetDateStr: string, baseDateStr: string = getLocalDateString()): number {
  const [tY, tM, tD] = targetDateStr.split('-').map(Number);
  const [bY, bM, bD] = baseDateStr.split('-').map(Number);
  const target = new Date(tY, tM - 1, tD);
  const base = new Date(bY, bM - 1, bD);
  return Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}
