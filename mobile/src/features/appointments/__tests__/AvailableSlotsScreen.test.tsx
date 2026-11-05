import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ActivityIndicator, Text } from 'react-native';
import { AvailableSlotsScreen } from '../../../screens/appointments/AvailableSlotsScreen';
import { getAppointmentAvailability, scheduleAppointment } from '../appointments.service';
import { AppointmentAvailability } from '../appointments.models';
import { AppAlertProvider } from '../../../components/feedback/AppAlertProvider';

jest.mock('../appointments.service', () => ({
  getAppointmentAvailability: jest.fn(), scheduleAppointment: jest.fn(), rescheduleAppointment: jest.fn()
}));
jest.mock('../../../assets/appointments/arrow-left.svg', () => 'ArrowLeft');
jest.mock('../../../assets/appointments/check-circle.svg', () => 'CheckCircle');
jest.mock('../../../assets/appointments/info.svg', () => 'Info');
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));

describe('Horários disponíveis', () => {
  const disponibilidade: AppointmentAvailability = { nutricionistaId: 1, nutricionistaNome: 'Nutri',
    especialidade: 'Nutrição', duracaoMinutos: 45, data: '2030-01-06', horarios: ['2030-01-06T09:00:00'] };
  let tree: renderer.ReactTestRenderer;
  const api = jest.mocked(getAppointmentAvailability);
  beforeEach(() => { api.mockReset(); api.mockResolvedValue(disponibilidade); });
  afterEach(async () => { if (tree) await act(async () => tree.unmount()); });
  async function abrir() {
    await act(async () => {
      tree = renderer.create(
        <AppAlertProvider>
          <AvailableSlotsScreen
            navigation={{ navigate: jest.fn(), goBack: jest.fn() } as never}
            route={{ params: { nutricionistaId: 1, data: '2030-01-06' } } as never} />
        </AppAlertProvider>);
    });
  }
  function dia(data: string) {
    return tree.root.findAll(p => p.props.accessibilityLabel === `Selecionar dia ${data}` && typeof p.props.onPress === 'function')[0];
  }
  it('exibe domingo e tocar novamente no dia atual não deixa a tela carregando', async () => {
    await abrir();
    expect(dia('2030-01-06')).toBeDefined();
    await act(async () => dia('2030-01-06').props.onPress());
    expect(api).toHaveBeenCalledTimes(1);
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(0);
    expect(JSON.stringify(tree.toJSON())).toContain('09:00-09:45');
  });
  it('ignora resposta atrasada de outro dia e limpa a seleção anterior', async () => {
    await abrir();
    const slot = tree.root.findAll(p => p.props.accessibilityRole === 'button' && typeof p.props.onPress === 'function'
      && p.findAllByType(Text).some(t => t.props.children === '09:00-09:45'))[0];
    await act(async () => slot.props.onPress());
    let responder: (value: AppointmentAvailability) => void = () => undefined;
    api.mockReturnValueOnce(new Promise(resolve => { responder = resolve; }));
    await act(async () => dia('2030-01-05').props.onPress());
    api.mockResolvedValueOnce({ ...disponibilidade, data: '2030-01-04', horarios: [] });
    await act(async () => dia('2030-01-04').props.onPress());
    await act(async () => responder(disponibilidade));
    expect(JSON.stringify(tree.toJSON())).toContain('Não há horários disponíveis');
    const confirmar = tree.root.findAll(p => p.props.accessibilityRole === 'button' && typeof p.props.onPress === 'function'
      && p.findAllByType(Text).some(t => t.props.children === 'Confirmar Horário'))[0];
    expect(confirmar.props.disabled).toBe(true);
    expect(scheduleAppointment).not.toHaveBeenCalled();
  });
});
