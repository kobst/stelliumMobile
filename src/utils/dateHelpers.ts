/**
 * Date utility functions for horoscope date range calculations
 * Based on the webapp's HoroscopeContainer date range logic
 */

export interface DateRange {
  start: Date;
  end: Date;
}

// Helper function to get current week's date range (Monday to Sunday)
export const getCurrentWeekRange = (): DateRange => {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
};

// Helper function to get next week's date range
export const getNextWeekRange = (): DateRange => {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) + 7);
  nextMonday.setHours(0, 0, 0, 0);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  nextSunday.setHours(23, 59, 59, 999);

  return { start: nextMonday, end: nextSunday };
};

// Helper function to get current month's date range
export const getCurrentMonthRange = (): DateRange => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return { start: startOfMonth, end: endOfMonth };
};

// Helper function to get next month's date range
export const getNextMonthRange = (): DateRange => {
  const now = new Date();
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  startOfNextMonth.setHours(0, 0, 0, 0);

  const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  endOfNextMonth.setHours(23, 59, 59, 999);

  return { start: startOfNextMonth, end: endOfNextMonth };
};

// Helper function to get today's date range
export const getTodayRange = (): DateRange => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return { start: startOfDay, end: endOfDay };
};

// Helper function to get tomorrow's date range
export const getTomorrowRange = (): DateRange => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const startOfTomorrow = new Date(tomorrow);
  startOfTomorrow.setHours(0, 0, 0, 0);

  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  return { start: startOfTomorrow, end: endOfTomorrow };
};

// Helper function to format dates for display
// Parse a date string into a local Date without timezone-shift for date-only values (YYYY-MM-DD)
export const parseDateStringAsLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date(NaN);

  // Extract just the date portion from ISO timestamps (YYYY-MM-DDTHH:mm:ss.sssZ)
  // This prevents timezone conversion from shifting the displayed date
  const dateOnlyMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnlyMatch) {
    const [y, m, d] = dateOnlyMatch[1].split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Fallback for unexpected formats
  return new Date(dateString);
};

export const formatDate = (dateString: string): string => {
  const date = parseDateStringAsLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to format date ranges
export const formatDateRange = (start: string, end: string): string => {
  const startDate = parseDateStringAsLocalDate(start);
  const endDate = parseDateStringAsLocalDate(end);

  if (startDate.toDateString() === endDate.toDateString()) {
    return formatDate(start);
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
};

// Helper function to get date range for a specific period
export const getDateRangeForPeriod = (period: string, customRange?: DateRange): DateRange => {
  switch (period) {
    case 'today':
      return getTodayRange();
    case 'tomorrow':
      return getTomorrowRange();
    case 'thisWeek':
      return getCurrentWeekRange();
    case 'nextWeek':
      return getNextWeekRange();
    case 'thisMonth':
      return getCurrentMonthRange();
    case 'nextMonth':
      return getNextMonthRange();
    case 'custom':
      return customRange || getCurrentWeekRange();
    default:
      return getCurrentWeekRange();
  }
};

// Helper function to check if two date ranges overlap
export const dateRangesOverlap = (range1: DateRange, range2: DateRange): boolean => {
  return range1.start <= range2.end && range1.end >= range2.start;
};

// Helper function to get start date for API calls
export const getStartDateForPeriod = (period: string): string => {
  const range = getDateRangeForPeriod(period);
  return range.start.toISOString().split('T')[0];
};
