import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { listAppointments } from '../../../features/appointments/appointments.service';
import { NotificationsScreen } from '../NotificationsScreen';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => jest.requireActual('react').useEffect(callback, [callback])
}));
jest.mock('../../../features/appointments/appointments.service', () => ({ listAppointments: jest.fn() }));

const appointments = jest.mocked(listAppointments);
const navigation = { goBack: jest.fn(), navigate: jest.fn() };

async function renderScreen() {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<NotificationsScreen navigation={navigation as never} route={{ key: 'notifications', name: 'Notificacoes' }} />);
  });
  return tree;
}

describe('NotificationsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exibe apenas consultas futuras e abre a agenda', async () => {
    appointments.mockResolvedValue([
      { id: 1, nutricionistaId: 2, nutricionistaNome: 'Nutri', dataHora: '2030-01-01T14:30:00', status: 'CONFIRMADA', versao: 1 },
      { id: 2, nutricionistaId: 2, nutricionistaNome: 'Nutri', dataHora: '2020-01-01T14:30:00', status: 'REALIZADA', versao: 1 }
    ]);
    const tree = await renderScreen();
    expect(appointments).toHaveBeenCalledTimes(1);
    expect(tree.root.findAllByType(Text).map((item) => item.props.children)).toContainEqual(['Consulta ', 'confirmada']);
    const reminders = tree.root.findAllByProps({ accessibilityRole: 'button' }).filter((item) => item.props.accessibilityLabel?.includes('Abrir agenda'));
    expect(reminders.length).toBeGreaterThan(0);
    await act(async () => reminders[0].props.onPress());
    expect(navigation.navigate).toHaveBeenCalledWith('Agenda');
    await act(async () => tree.unmount());
  });

  it('mostra estado vazio quando não há consultas futuras', async () => {
    appointments.mockResolvedValue([]);
    const tree = await renderScreen();
    expect(tree.root.findAllByType(Text).map((item) => item.props.children)).toContain('Tudo em dia');
    await act(async () => tree.unmount());
  });
});
