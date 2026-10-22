import { Appointment } from './appointments.models';

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/render';
const APPOINTMENT_DURATION_MINUTES = 45;

export function buildGoogleCalendarUrl(appointment: Appointment): string {
  const start = parseFloatingDateTime(appointment.dataHora);
  const end = new Date(start.getTime() + APPOINTMENT_DURATION_MINUTES * 60_000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Consulta de Nutrição',
    dates: `${formatFloatingDateTime(start)}/${formatFloatingDateTime(end)}`,
    ctz: 'America/Sao_Paulo',
    details: `Consulta com ${appointment.nutricionistaNome}. Evento gerado pelo Nutri4You.`
  });
  return `${GOOGLE_CALENDAR_URL}?${params.toString()}`;
}

function parseFloatingDateTime(value: string): Date {
  const [datePart, timePart = '00:00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = timePart.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function formatFloatingDateTime(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hour}${minute}${second}`;
}
