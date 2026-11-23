import { formatarDataCivil } from '../../core/utils/date-mask.util';

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

export function monthTitle(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function shiftMonthKey(monthKey: string, amount: number): string {
  const month = fromDateKey(`${monthKey}-01`);
  return toDateKey(new Date(month.getFullYear(), month.getMonth() + amount, 1)).slice(0, 7);
}

export function appointmentDateLabel(value: string): string {
  return formatarDataCivil(value);
}

export function timeRangeLabel(value: string, durationMinutes = 45): string {
  const inicio = new Date(`${value}Z`);
  if (!Number.isFinite(inicio.getTime())) return '';
  const fim = new Date(inicio.getTime() + durationMinutes * 60_000);
  return `${inicio.toISOString().slice(11, 16)}-${fim.toISOString().slice(11, 16)}`;
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

export function isAppointmentDateSelectable(dateKey: string, dataAtual: string): boolean {
  return dateKey >= dataAtual;
}

export function dateKeyFromLocalDateTime(value: string): string {
  return value.slice(0, 10);
}

export function groupSlotsByPeriod(slots: string[]): { morning: string[]; afternoon: string[] } {
  return slots.reduce(
    (groups, slot) => {
      const hora = Number(slot.slice(11, 13));
      (hora < 12 ? groups.morning : groups.afternoon).push(slot);
      return groups;
    },
    { morning: [] as string[], afternoon: [] as string[] }
  );
}
