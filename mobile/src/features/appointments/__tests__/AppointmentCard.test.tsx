import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppointmentCard } from '../components/AppointmentCard';
import { Appointment } from '../appointments.models';

jest.mock('../../../assets/appointments/calendar-date.svg', () => 'CalendarDateIcon');
jest.mock('../../../assets/appointments/clock.svg', () => 'ClockIcon');

describe('Ações do agendamento', () => {
  const base: Appointment = { id: 1, nutricionistaId: 1, nutricionistaNome: 'Nutri',
    dataHora: '2030-01-07T12:00:00', status: 'CONFIRMADA', versao: 0 };

  it.each([
    ['AGUARDANDO_CONFIRMACAO', null, false, 'AGUARDANDO CONFIRMAÇÃO'],
    ['CONFIRMADA', null, true, 'CONFIRMADO'],
    ['CONFIRMADA', '2030-01-07T11:55:00', false, 'EM ATENDIMENTO']
  ] as const)('apresenta ações coerentes para %s iniciado=%s', async (status, iniciadaEm, permiteAcoes, texto) => {
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(<AppointmentCard appointment={{ ...base, status, iniciadaEm }}
        onAddToCalendar={jest.fn()} onReschedule={jest.fn()} onCancel={jest.fn()} />);
    });
    const json = JSON.stringify(tree?.toJSON());
    expect(json).toContain(texto);
    for (const acao of ['Reagendar', 'Cancelar', 'Adicionar ao Google Agenda']) {
      expect(json.includes(acao)).toBe(permiteAcoes);
    }
    await act(async () => { tree?.unmount(); });
  });
});
