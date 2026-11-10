import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Pressable, Text } from 'react-native';

import { listAppointments } from '../../../features/appointments/appointments.service';
import { NotificationsScreen } from '../NotificationsScreen';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => jest.requireActual('react').useEffect(callback, [callback])
}));
jest.mock('../../../features/appointments/appointments.service', () => ({ listAppointments: jest.fn() }));

const appointments = jest.mocked(listAppointments);
const navigation = {
  canGoBack: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
  replace: jest.fn()
};

async function renderScreen() {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<NotificationsScreen navigation={navigation as never} route={{ key: 'notifications', name: 'Notificacoes' }} />);
  });
  return tree;
}

describe('NotificationsScreen', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

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

  it.each([
    { agora: '2026-11-11T12:59:59.999Z', visivel: true },
    { agora: '2026-11-11T13:00:00.000Z', visivel: true },
    { agora: '2026-11-11T13:00:00.001Z', visivel: false }
  ])('compara o lembrete das 10h de São Paulo com $agora', async ({ agora, visivel }) => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse(agora));
    appointments.mockResolvedValue([
      { id: 1, nutricionistaId: 2, nutricionistaNome: 'Nutri', dataHora: '2026-11-11T10:00:00', status: 'CONFIRMADA', versao: 1 }
    ]);
    const tree = await renderScreen();
    const lembretes = tree.root.findAllByType(Pressable)
      .filter(item => item.props.accessibilityLabel?.includes('Abrir agenda'));

    expect(lembretes).toHaveLength(visivel ? 1 : 0);
    if (visivel) expect(lembretes[0].props.accessibilityLabel).toContain('10:00');
    await act(async () => tree.unmount());
  });

  it('volta ao dashboard quando a tela foi aberta sem histórico', async () => {
    appointments.mockResolvedValue([]);
    navigation.canGoBack.mockReturnValue(false);
    const tree = await renderScreen();
    const voltar = tree.root.findAllByType(Pressable).find(item => item.props.accessibilityLabel === 'Voltar')!;
    await act(async () => voltar.props.onPress());

    expect(navigation.replace).toHaveBeenCalledWith('Dashboard');
    expect(navigation.goBack).not.toHaveBeenCalled();
    await act(async () => tree.unmount());
  });

  it('mostra estado vazio quando não há consultas futuras', async () => {
    appointments.mockResolvedValue([]);
    const tree = await renderScreen();
    expect(tree.root.findAllByType(Text).map((item) => item.props.children)).toContain('Tudo em dia');
    await act(async () => tree.unmount());
  });
});
