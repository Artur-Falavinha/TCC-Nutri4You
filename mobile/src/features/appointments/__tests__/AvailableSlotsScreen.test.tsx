import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ActivityIndicator, Text } from 'react-native';
import { AvailableSlotsScreen } from '../../../screens/appointments/AvailableSlotsScreen';
import { getAppointmentAvailability, scheduleAppointment } from '../appointments.service';
import { Appointment, AppointmentAvailability } from '../appointments.models';

jest.mock('../appointments.service', () => ({
  getAppointmentAvailability: jest.fn(), scheduleAppointment: jest.fn(), rescheduleAppointment: jest.fn(),
  listAgendaNutritionists: jest.fn().mockResolvedValue([{ id: 1, nome: 'Nutri', vinculado: false }]),
  listAppointments: jest.fn().mockResolvedValue([])
}));
jest.mock('../../../core/perfil/foto-perfil.service', () => ({
  carregarFotoNutricionistaNaAgenda: jest.fn().mockResolvedValue(null)
}));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));

describe('Horários disponíveis', () => {
  const disponibilidade: AppointmentAvailability = { nutricionistaId: 1, nutricionistaNome: 'Nutri',
    especialidade: 'Nutrição', duracaoMinutos: 45, data: '2030-01-06', horarios: ['2030-01-06T09:00:00'] };
  let tree: renderer.ReactTestRenderer;
  const api = jest.mocked(getAppointmentAvailability);
  const solicitar = jest.mocked(scheduleAppointment);
  const voltarAgenda = jest.fn();
  beforeEach(() => {
    api.mockReset();
    api.mockResolvedValue(disponibilidade);
    solicitar.mockReset();
    voltarAgenda.mockReset();
  });
  afterEach(async () => { if (tree) await act(async () => tree.unmount()); });
  async function abrir() {
    await act(async () => {
      tree = renderer.create(
        <AvailableSlotsScreen
          navigation={{ popTo: voltarAgenda } as never}
          route={{ params: { nutricionistaId: 1, data: '2030-01-06' } } as never}
        />);
    });
  }
  function dia(data: string) {
    return tree.root.findAll(p => p.props.accessibilityLabel === `Selecionar dia ${data}` && typeof p.props.onPress === 'function')[0];
  }
  function botoesComTexto(texto: string) {
    return tree.root.findAll(p => p.props.accessibilityRole === 'button' && typeof p.props.onPress === 'function'
      && p.findAllByType(Text).some(t => t.props.children === texto));
  }
  it('exibe domingo e tocar novamente no dia atual não deixa a tela carregando', async () => {
    await abrir();
    expect(dia('06/01/2030')).toBeDefined();
    await act(async () => dia('06/01/2030').props.onPress());
    expect(api).toHaveBeenCalledTimes(1);
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(0);
    expect(JSON.stringify(tree.toJSON())).toContain('09:00-09:45');
  });
  it('ignora resposta atrasada de outro dia e limpa a seleção anterior', async () => {
    await abrir();
    const slot = botoesComTexto('09:00-09:45')[0];
    await act(async () => slot.props.onPress());
    let responder: (value: AppointmentAvailability) => void = () => undefined;
    api.mockReturnValueOnce(new Promise(resolve => { responder = resolve; }));
    await act(async () => dia('05/01/2030').props.onPress());
    api.mockResolvedValueOnce({ ...disponibilidade, data: '2030-01-04', horarios: [] });
    await act(async () => dia('04/01/2030').props.onPress());
    await act(async () => responder(disponibilidade));
    expect(JSON.stringify(tree.toJSON())).toContain('Não há horários disponíveis');
    expect(botoesComTexto('Solicitar consulta')).toHaveLength(0);
    expect(scheduleAppointment).not.toHaveBeenCalled();
  });

  it('exibe a consulta e o vínculo pendentes só depois do retorno da API', async () => {
    await abrir();
    let responder: (consulta: Appointment) => void = () => undefined;
    solicitar.mockReturnValueOnce(new Promise(resolve => { responder = resolve; }));
    await act(async () => botoesComTexto('09:00-09:45')[0].props.onPress());
    const enviar = botoesComTexto('Solicitar consulta')[0].props.onPress;
    await act(async () => { enviar(); enviar(); });
    expect(solicitar).toHaveBeenCalledTimes(1);
    expect(solicitar).toHaveBeenCalledWith({ nutricionistaId: 1, dataHora: '2030-01-06T09:00:00' });
    expect(tree.root.findAllByProps({ testID: 'agenda-comprovante' })).toHaveLength(0);
    await act(async () => responder({
      id: 4, nutricionistaId: 1, nutricionistaNome: 'Nutri',
      dataHora: '2030-01-06T09:00:00', status: 'AGUARDANDO_CONFIRMACAO', avulsa: true, versao: 0
    }));
    expect(JSON.stringify(tree.toJSON())).toContain('Consulta aguardando confirmação');
    expect(JSON.stringify(tree.toJSON())).toContain('Vínculo pendente');
    expect(voltarAgenda).not.toHaveBeenCalled();
    await act(async () => botoesComTexto('Acompanhar na agenda')[0].props.onPress());
    expect(voltarAgenda).toHaveBeenCalledWith('Agenda');
  });
});
