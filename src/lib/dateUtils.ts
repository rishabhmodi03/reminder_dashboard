import { addDays, format, parseISO, isSameDay, isBefore, isAfter, startOfDay } from 'date-fns';

export function getTodayStr() {
    return format(new Date(), 'yyyy-MM-dd');
}

export function parseDateStr(dateStr: string) {
    // Parsing as ISO creates local time at midnight by assuming it's UTC then local if missing timezone, 
    // but date-fns parseISO with yyyy-MM-dd sets to local midnight for that date
    return parseISO(dateStr);
}

export function isDateToday(dateStr: string) {
    return dateStr === getTodayStr();
}

export function isDatePast(dateStr: string) {
    const today = startOfDay(new Date());
    const date = parseDateStr(dateStr);
    return isBefore(date, today);
}

export function addDaysToStr(dateStr: string, daysToAdd: number) {
    const date = parseDateStr(dateStr);
    const newDate = addDays(date, daysToAdd);
    return format(newDate, 'yyyy-MM-dd');
}
