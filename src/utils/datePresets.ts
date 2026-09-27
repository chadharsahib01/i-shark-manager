import { getLocalDateString, addDaysLocal } from './dateUtils';

export type DateRangePresetId =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last15days'
  | 'last30days'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'last3Months'
  | 'thisYear'
  | 'allTime'
  | 'custom';

export interface DateRangePresetDef {
  id: DateRangePresetId;
  label: string;
  shortLabel: string;
  category: 'Popular' | 'Recent' | 'Calendar' | 'Extended';
  description: string;
}

export const DATE_RANGE_PRESETS: DateRangePresetDef[] = [
  {
    id: 'thisMonth',
    label: 'Current Month',
    shortLabel: 'This Month',
    category: 'Popular',
    description: '1st of current month through month end',
  },
  {
    id: 'lastMonth',
    label: 'Last Month',
    shortLabel: 'Last Month',
    category: 'Popular',
    description: 'Full previous calendar month',
  },
  {
    id: 'last7days',
    label: 'Last 7 Days',
    shortLabel: '7 Days',
    category: 'Popular',
    description: 'Past 7 days including today',
  },
  {
    id: 'last15days',
    label: 'Last 15 Days',
    shortLabel: '15 Days',
    category: 'Popular',
    description: 'Past 15 days including today',
  },
  {
    id: 'today',
    label: 'Today',
    shortLabel: 'Today',
    category: 'Recent',
    description: 'Single day: today only',
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    shortLabel: 'Yesterday',
    category: 'Recent',
    description: 'Single day: yesterday only',
  },
  {
    id: 'thisWeek',
    label: 'Current Week',
    shortLabel: 'This Week',
    category: 'Recent',
    description: 'From start of this week through today',
  },
  {
    id: 'lastWeek',
    label: 'Last Week',
    shortLabel: 'Last Week',
    category: 'Recent',
    description: 'Full previous week (Mon – Sun)',
  },
  {
    id: 'last30days',
    label: 'Last 30 Days',
    shortLabel: '30 Days',
    category: 'Extended',
    description: 'Past 30 days window',
  },
  {
    id: 'last3Months',
    label: 'Last 3 Months',
    shortLabel: '3 Months',
    category: 'Extended',
    description: 'Past 90 days of records',
  },
  {
    id: 'thisYear',
    label: 'Current Year',
    shortLabel: 'This Year',
    category: 'Extended',
    description: 'Jan 1 through Dec 31 of this year',
  },
  {
    id: 'allTime',
    label: 'All Time',
    shortLabel: 'All Records',
    category: 'Extended',
    description: 'All recorded attendance without date restriction',
  },
  {
    id: 'custom',
    label: 'Custom Date Range',
    shortLabel: 'Custom',
    category: 'Extended',
    description: 'Pick exact custom start and end dates',
  },
];

/**
 * Friendly single date formatter: e.g. "Sep 27, 2026"
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const mIndex = parseInt(monthStr, 10) - 1;
  const monthName = monthNames[mIndex] || monthStr;
  const dayNum = parseInt(dayStr, 10);
  return `${monthName} ${dayNum}, ${yearStr}`;
}

/**
 * Returns calculated { startDate, endDate, label } for a given preset ID.
 */
export function getPresetDateRange(
  presetId: DateRangePresetId,
  currentCustomStart?: string,
  currentCustomEnd?: string
): { startDate: string; endDate: string; label: string } {
  const today = getLocalDateString();
  const [currentYearStr, currentMonthStr] = today.split('-');
  const curYear = parseInt(currentYearStr, 10);
  const curMonthIndex = parseInt(currentMonthStr, 10) - 1;

  switch (presetId) {
    case 'today':
      return {
        startDate: today,
        endDate: today,
        label: `Today (${formatFriendlyDate(today)})`,
      };

    case 'yesterday': {
      const yesterday = addDaysLocal(today, -1);
      return {
        startDate: yesterday,
        endDate: yesterday,
        label: `Yesterday (${formatFriendlyDate(yesterday)})`,
      };
    }

    case 'last7days': {
      const startDate = addDaysLocal(today, -6);
      return {
        startDate,
        endDate: today,
        label: `Last 7 Days (${formatFriendlyDate(startDate)} – ${formatFriendlyDate(today)})`,
      };
    }

    case 'last15days': {
      const startDate = addDaysLocal(today, -14);
      return {
        startDate,
        endDate: today,
        label: `Last 15 Days (${formatFriendlyDate(startDate)} – ${formatFriendlyDate(today)})`,
      };
    }

    case 'last30days': {
      const startDate = addDaysLocal(today, -29);
      return {
        startDate,
        endDate: today,
        label: `Last 30 Days (${formatFriendlyDate(startDate)} – ${formatFriendlyDate(today)})`,
      };
    }

    case 'thisWeek': {
      // Monday as week start
      const d = new Date();
      const day = d.getDay(); // 0 is Sun, 1 is Mon
      const diffToMon = day === 0 ? -6 : 1 - day;
      const startDate = addDaysLocal(today, diffToMon);
      return {
        startDate,
        endDate: today,
        label: `Current Week (${formatFriendlyDate(startDate)} – ${formatFriendlyDate(today)})`,
      };
    }

    case 'lastWeek': {
      const d = new Date();
      const day = d.getDay();
      const diffToLastMon = (day === 0 ? -6 : 1 - day) - 7;
      const startDate = addDaysLocal(today, diffToLastMon);
      const endDate = addDaysLocal(startDate, 6);
      return {
        startDate,
        endDate,
        label: `Last Week (${formatFriendlyDate(startDate)} – ${formatFriendlyDate(endDate)})`,
      };
    }

    case 'thisMonth': {
      const lastDayDate = new Date(curYear, curMonthIndex + 1, 0);
      const lastDay = String(lastDayDate.getDate()).padStart(2, '0');
      const startDate = `${currentYearStr}-${currentMonthStr}-01`;
      const endDate = `${currentYearStr}-${currentMonthStr}-${lastDay}`;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return {
        startDate,
        endDate,
        label: `Current Month (${monthNames[curMonthIndex]} ${curYear})`,
      };
    }

    case 'lastMonth': {
      const prevDate = new Date(curYear, curMonthIndex - 1, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonthStr = String(prevDate.getMonth() + 1).padStart(2, '0');
      const prevLastDay = String(new Date(prevYear, prevDate.getMonth() + 1, 0).getDate()).padStart(2, '0');
      const startDate = `${prevYear}-${prevMonthStr}-01`;
      const endDate = `${prevYear}-${prevMonthStr}-${prevLastDay}`;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return {
        startDate,
        endDate,
        label: `Last Month (${monthNames[prevDate.getMonth()]} ${prevYear})`,
      };
    }

    case 'last3Months': {
      const startDate = addDaysLocal(today, -89);
      return {
        startDate,
        endDate: today,
        label: `Last 3 Months (${formatFriendlyDate(startDate)} – ${formatFriendlyDate(today)})`,
      };
    }

    case 'thisYear': {
      const startDate = `${curYear}-01-01`;
      const endDate = `${curYear}-12-31`;
      return {
        startDate,
        endDate,
        label: `Current Year (${curYear})`,
      };
    }

    case 'allTime': {
      const startDate = '2020-01-01';
      return {
        startDate,
        endDate: today,
        label: `All Time (All Recorded History)`,
      };
    }

    case 'custom':
    default: {
      const start = currentCustomStart || `${currentYearStr}-${currentMonthStr}-01`;
      const end = currentCustomEnd || today;
      return {
        startDate: start,
        endDate: end,
        label: `Custom Range (${formatFriendlyDate(start)} – ${formatFriendlyDate(end)})`,
      };
    }
  }
}

/**
 * Formats a clean date range string for report titles, document headers, and badges.
 */
export function formatRangeDisplay(
  startDate: string,
  endDate: string,
  presetId?: DateRangePresetId
): string {
  if (startDate === '2020-01-01' && presetId === 'allTime') {
    return 'All Recorded History';
  }

  if (startDate === endDate) {
    return formatFriendlyDate(startDate);
  }

  const [sYear, sMonth, sDay] = startDate.split('-');
  const [eYear, eMonth, eDay] = endDate.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const sMonthName = monthNames[parseInt(sMonth, 10) - 1] || sMonth;
  const eMonthName = monthNames[parseInt(eMonth, 10) - 1] || eMonth;

  if (sYear === eYear && sMonth === eMonth) {
    return `${sMonthName} ${parseInt(sDay, 10)} – ${parseInt(eDay, 10)}, ${sYear}`;
  }

  if (sYear === eYear) {
    return `${sMonthName} ${parseInt(sDay, 10)} – ${eMonthName} ${parseInt(eDay, 10)}, ${sYear}`;
  }

  return `${sMonthName} ${parseInt(sDay, 10)}, ${sYear} – ${eMonthName} ${parseInt(eDay, 10)}, ${eYear}`;
}

/**
 * Calculate the number of days inclusive between two dates.
 */
export function countDaysInclusive(startDate: string, endDate: string): number {
  if (startDate === '2020-01-01') return 9999;
  const [sY, sM, sD] = startDate.split('-').map(Number);
  const [eY, eM, eD] = endDate.split('-').map(Number);
  const start = new Date(sY, sM - 1, sD).getTime();
  const end = new Date(eY, eM - 1, eD).getTime();
  const diffTime = Math.max(0, end - start);
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Generates a clean URL-friendly or filename-friendly slug for the date range
 */
export function getDateRangeSlug(
  startDate: string,
  endDate: string,
  presetId?: DateRangePresetId
): string {
  if (presetId && presetId !== 'custom') {
    return `${presetId}_${startDate}_to_${endDate}`;
  }
  return `${startDate}_to_${endDate}`;
}
