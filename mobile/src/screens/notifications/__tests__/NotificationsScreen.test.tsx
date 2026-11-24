import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { getToken } from '../../../core/auth/token-storage';
import { carregarPerfil } from '../../../core/perfil/perfil.service';
import { gravarVistas, lerVistas } from '../../../features/notificacoes/leitura-storage';
import { NotificacoesProvider, useNotificacoes } from '../../../features/notificacoes/NotificacoesProvider';

import { listAppointments } from '../../../features/appointments/appointments.service';
import { NotificationsScreen } from '../NotificationsScreen';

jest.mock('../../../core/auth/token-storage', () => ({ getToken: jest.fn() }));
jest.mock('../../../core/perfil/perfil.service', () => ({ carregarPerfil: jest.fn() }));
jest.mock('../../../features/notificacoes/leitura-storage', () => ({ lerVistas: jest.fn(), gravarVistas: jest.fn() }));
jest.mock('../../../components/layout/AppHeader', () => ({
  AppHeader: ({ onOpenMenu }: { onOpenMenu: () => void }) => {
    const { View: Botao } = jest.requireActual('react-native');
    return <Botao testID="abrir-menu" onTouchEnd={onOpenMenu} />;
  }
}));
jest.mock('../../../components/navigation/SideMenu', () => ({
  SideMenu: ({ visible, activeItem }: { visible: boolean; activeItem: string }) => {
    const { Text: Rotulo } = jest.requireActual('react-native');
    return visible ? <Rotulo testID="aba-ativa">{activeItem}</Rotulo> : null;
  }
}));
jest.mock('../../../features/appointments/appointments.service', () => ({ listAppointments: jest.fn() }));

const appointments = jest.mocked(listAppointments);
const navigation = { navigate: jest.fn() };

async function renderScreen() {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <NotificacoesProvider rota="Notificacoes">
        <NotificationsScreen navigation={navigation as never} route={{ key: 'notifications', name: 'Notificacoes' }} />
      </NotificacoesProvider>
    );
  });
  return tree;
}

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getToken).mockResolvedValue('sessao-teste');
    jest.mocked(carregarPerfil).mockResolvedValue({
      id: 2, nome: 'Paciente Teste', email: 'paciente@example.test',
      telefone: null, sexo: null, dataNascimento: null
    });
    jest.mocked(lerVistas).mockResolvedValue(new Set());
  });
  afterEach(() => jest.restoreAllMocks());

  it('exibe apenas consultas futuras e abre a agenda', async () => {
    appointments.mockResolvedValue([
      { id: 1, nutricionistaId: 2, nutricionistaNome: 'Nutri', dataHora: '2030-01-01T14:30:00', status: 'CONFIRMADA', versao: 1 },
      { id: 2, nutricionistaId: 2, nutricionistaNome: 'Nutri', dataHora: '2020-01-01T14:30:00', status: 'REALIZADA', versao: 1 }
    ]);
    const tree = await renderScreen();
    expect(appointments).toHaveBeenCalledTimes(1);
    const textos = tree.root.findAllByType(Text).map((item) => item.props.children);
    expect(textos).toContain('Consulta confirmada');
    expect(textos).toContain('01/01/2030, às 14:30');
    const reminders = tree.root.findAllByProps({ accessibilityRole: 'button' }).filter((item) => item.props.accessibilityLabel?.includes('Abrir agenda'));
    expect(reminders.length).toBeGreaterThan(0);
    expect(reminders[0].props.accessibilityLabel).toContain('01/01/2030, às 14:30');
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
    const horarioVisivel = tree.root.findAllByType(Text)
      .some(item => typeof item.props.children === 'string' && item.props.children.includes('10:00'));

    expect(horarioVisivel).toBe(visivel);
    await act(async () => tree.unmount());
  });

  it('abre a sidebar com Notificações como aba ativa', async () => {
    appointments.mockResolvedValue([]);
    const tree = await renderScreen();
    const menu = tree.root.findAllByProps({ testID: 'abrir-menu' })
      .find(item => typeof item.props.onTouchEnd === 'function')!;
    await act(async () => menu.props.onTouchEnd());
    expect(tree.root.findAllByProps({ testID: 'aba-ativa' })[0].props.children).toBe('notifications');
    await act(async () => tree.unmount());
  });

  it('registra o lembrete ao visitar a aba e volta a contar uma nova versão', async () => {
    const consulta = {
      id: 8, nutricionistaId: 2, nutricionistaNome: 'Nutri', dataHora: '2030-06-01T13:00:00',
      status: 'CONFIRMADA', versao: 1
    } as const;
    appointments.mockResolvedValue([consulta]);

    function Quantidade() {
      return <Text>{useNotificacoes().quantidade}</Text>;
    }

    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<NotificacoesProvider rota="Agenda"><Quantidade /></NotificacoesProvider>);
    });
    expect(tree.root.findByType(Text).props.children).toBe(1);
    expect(gravarVistas).not.toHaveBeenCalled();

    await act(async () => {
      tree.update(<NotificacoesProvider rota="Notificacoes"><Quantidade /></NotificacoesProvider>);
    });
    expect(tree.root.findByType(Text).props.children).toBe(0);
    expect(gravarVistas).toHaveBeenCalledWith(2, new Set(['8:CONFIRMADA:1']));

    appointments.mockResolvedValue([{ ...consulta, versao: 2 }]);
    await act(async () => {
      tree.update(<NotificacoesProvider rota="Agenda"><Quantidade /></NotificacoesProvider>);
    });
    expect(tree.root.findByType(Text).props.children).toBe(1);
    await act(async () => tree.unmount());
  });

  it('mostra estado vazio quando não há consultas futuras', async () => {
    appointments.mockResolvedValue([]);
    const tree = await renderScreen();
    expect(tree.root.findAllByType(Text).map((item) => item.props.children)).toContain('Tudo em dia');
    await act(async () => tree.unmount());
  });

  it('exibe a recusa de consulta como notificação acionável', async () => {
    appointments.mockResolvedValue([
      { id: 3, nutricionistaId: 2, nutricionistaNome: 'Nutri', dataHora: '2030-02-01T09:00:00', status: 'RECUSADA', versao: 2 }
    ]);

    const tree = await renderScreen();
    const textos = tree.root.findAllByType(Text).map((item) => item.props.children);
    expect(textos).toContain('Consulta recusada');
    expect(textos).toContain('O nutricionista não pôde aceitar este horário. Escolha uma nova data na agenda.');
    expect(textos).not.toContain('Tudo em dia');
    await act(async () => tree.unmount());
  });
});
