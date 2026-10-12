import {
  appointmentDateLabel,
  buildCalendarDays,
  buildWeekDays,
  groupSlotsByPeriod,
  monthTitle,
  timeRangeLabel,
  toDateKey
} from '../appointments-date.util';

describe('appointments date utilities', () => {
  it('monta o calendário respeitando o primeiro dia real do mês', () => {
    const days = buildCalendarDays(new Date(2026, 9, 1));

    expect(days).toHaveLength(35);
    expect(days.slice(0, 4).every((day) => day.dateKey === null)).toBe(true);
    expect(days[4]).toMatchObject({ day: 1, dateKey: '2026-10-01' });
    expect(days.at(-1)).toMatchObject({ day: 31, dateKey: '2026-10-31' });
  });

  it('gera a semana de segunda a sábado para o carrossel', () => {
    const week = buildWeekDays('2026-10-22').map(toDateKey);

    expect(week).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24'
    ]);
  });

  it('formata mês, data e intervalo de 45 minutos em português', () => {
    expect(monthTitle(new Date(2026, 9, 22))).toBe('Outubro 2026');
    expect(appointmentDateLabel('2026-10-25T14:30:00')).toBe('25 Out, 2026');
    expect(timeRangeLabel('2026-10-25T14:30:00')).toBe('14:30-15:15');
  });

  it('separa horários por turno', () => {
    const slots = groupSlotsByPeriod([
      '2026-10-22T08:00:00',
      '2026-10-22T11:00:00',
      '2026-10-22T14:45:00'
    ]);

    expect(slots.morning).toHaveLength(2);
    expect(slots.afternoon).toEqual(['2026-10-22T14:45:00']);
  });
});
