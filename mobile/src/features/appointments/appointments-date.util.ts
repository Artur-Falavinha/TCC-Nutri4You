const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const SHORT_MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez'
];

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export interface CalendarDay {
  key: string;
  day: number;
  dateKey: string | null;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function fromLocalDateTime(value: string): Date {
  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

export function monthTitle(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function shiftMonthKey(monthKey: string, amount: number): string {
  const month = fromDateKey(`${monthKey}-01`);
  return toDateKey(new Date(month.getFullYear(), month.getMonth() + amount, 1)).slice(0, 7);
}

export function appointmentDateLabel(value: string): string {
  const date = fromLocalDateTime(value);
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

export function appointmentLongDateLabel(value: string): string {
  const date = fromLocalDateTime(value);
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function timeRangeLabel(value: string, durationMinutes = 45): string {
  const start = fromLocalDateTime(value);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return `${formatTime(start)}-${formatTime(end)}`;
}

export function buildCalendarDays(month: Date): CalendarDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = new Date(year, monthIndex, 1).getDay();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((offset + totalDays) / 7) * 7;
  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - offset + 1;
    return day < 1 || day > totalDays
      ? { key: `empty-${index}`, day: 0, dateKey: null }
      : {
          key: `${year}-${monthIndex}-${day}`,
          day,
          dateKey: toDateKey(new Date(year, monthIndex, day))
        };
  });
}

export function buildWeekDays(selectedDateKey: string): Date[] {
  const selected = fromDateKey(selectedDateKey);
  const weekday = selected.getDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = new Date(selected);
  monday.setDate(selected.getDate() - daysSinceMonday);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

export function weekdayShort(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function isPastDate(dateKey: string, today = new Date()): boolean {
  return fromDateKey(dateKey).getTime() < new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
}

export function isAppointmentDateSelectable(dateKey: string, today = new Date()): boolean {
  return !isPastDate(dateKey, today);
}

export function dateKeyFromLocalDateTime(value: string): string {
  return value.slice(0, 10);
}

export function groupSlotsByPeriod(slots: string[]): { morning: string[]; afternoon: string[] } {
  return slots.reduce(
    (groups, slot) => {
      const date = fromLocalDateTime(slot);
      (date.getHours() < 12 ? groups.morning : groups.afternoon).push(slot);
      return groups;
    },
    { morning: [] as string[], afternoon: [] as string[] }
  );
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
