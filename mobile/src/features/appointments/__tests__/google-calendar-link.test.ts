import { buildGoogleCalendarUrl } from '../google-calendar-link';
import { Appointment } from '../appointments.models';

function appointment(dataHora: string): Appointment {
  return {
    id: 12,
    nutricionistaId: 7,
    nutricionistaNome: 'Dra. Ana Silva',
    dataHora,
    status: 'CONFIRMADA',
    versao: 2
  };
}

describe('Google Calendar link', () => {
  it('preenche o evento sem credenciais ou dados clínicos', () => {
    const url = new URL(buildGoogleCalendarUrl(appointment('2026-10-22T14:00:00')));

    expect(url.origin).toBe('https://calendar.google.com');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Consulta de Nutrição');
    expect(url.searchParams.get('dates')).toBe('20261022T140000/20261022T144500');
    expect(url.searchParams.get('ctz')).toBe('America/Sao_Paulo');
    expect(url.searchParams.get('details')).toContain('Dra. Ana Silva');
  });

  it('calcula corretamente o término quando muda o dia', () => {
    const url = new URL(buildGoogleCalendarUrl(appointment('2026-10-22T23:45:00')));

    expect(url.searchParams.get('dates')).toBe('20261022T234500/20261023T003000');
  });
});
