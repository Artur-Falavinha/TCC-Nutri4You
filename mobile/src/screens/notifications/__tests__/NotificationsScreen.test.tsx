import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { getToken } from '../../../core/auth/token-storage';
import { carregarPerfil } from '../../../core/perfil/perfil.service';
import { gravarVistas, lerVistas } from '../../../features/notificacoes/leitura-storage';
import { NotificacoesProvider, useNotificacoes } from '../../../features/notificacoes/NotificacoesProvider';
import { listarAvisosConsulta, listarAvisosExames, listarAvisosPlanos } from '../../../features/notificacoes/notificacoes.service';

import { listAppointments } from '../../../features/appointments/appointments.service';
import { NotificationsScreen } from '../NotificationsScreen';

jest.mock('../../../core/auth/token-storage', () => ({ getToken: jest.fn() }));
jest.mock('../../../core/perfil/perfil.service', () => ({ carregarPerfil: jest.fn() }));
jest.mock('../../../features/notificacoes/leitura-storage', () => ({ lerVistas: jest.fn(), gravarVistas: jest.fn() }));
jest.mock('../../../features/notificacoes/notificacoes.service', () => ({
  ...jest.requireActual('../../../features/notificacoes/notificacoes.service'),
  listarAvisosConsulta: jest.fn(),
  listarAvisosExames: jest.fn(),
  listarAvisosPlanos: jest.fn()
}));
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
    jest.mocked(listarAvisosConsulta).mockResolvedValue([]);
    jest.mocked(listarAvisosExames).mockResolvedValue([]);
    jest.mocked(listarAvisosPlanos).mockResolvedValue([]);
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

  it('mostra o histórico de decisões e conta as atualizações uma única vez no sino', async () => {
    const confirmada = { id: 1, consultaId: 8, tipo: 'CONFIRMADA', dataHora: '2030-01-01T10:00:00', criadaEm: '2029-12-20T14:00:00Z' } as const;
    const reagendada = { ...confirmada, id: 2, tipo: 'REAGENDADA', dataHora: '2030-01-01T13:00:00' } as const;
    jest.mocked(listarAvisosConsulta).mockResolvedValue([reagendada, confirmada]);
    appointments.mockResolvedValue([
      { id: 8, nutricionistaId: 2, nutricionistaNome: 'Nutri', dataHora: reagendada.dataHora, status: 'CONFIRMADA', versao: 3 }
    ]);

    function Quantidade() {
      return <Text testID="total-avisos">{useNotificacoes().quantidade}</Text>;
    }

    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<NotificacoesProvider rota="Agenda"><Quantidade /></NotificacoesProvider>);
    });
    expect(tree.root.findByType(Text).props.children).toBe(2);
    jest.mocked(listarAvisosConsulta).mockResolvedValue([{ ...reagendada, id: 3, tipo: 'CANCELADA' }, reagendada, confirmada]);
    appointments.mockResolvedValue([]);
    await act(async () => {
      tree.update(
        <NotificacoesProvider rota="Notificacoes">
          <Quantidade />
          <NotificationsScreen navigation={navigation as never} route={{ key: 'notifications', name: 'Notificacoes' }} />
        </NotificacoesProvider>
      );
    });
    const textos = tree.root.findAllByType(Text).map(item => item.props.children);
    expect(textos).toEqual(expect.arrayContaining(['Consulta cancelada', 'Consulta reagendada', 'Consulta confirmada']));
    expect(tree.root.findByType(Quantidade).findByType(Text).props.children).toBe(0);
    expect(gravarVistas).toHaveBeenCalledWith(2, new Set(['aviso:3', 'aviso:2', 'aviso:1']));
    await act(async () => tree.unmount());
  });

  it('mostra o plano publicado e a atualização com destino para Dieta', async () => {
    const plano = { id: 3, titulo: 'Plano semanal', vigenciaInicio: '2030-01-01',
      vigenciaFim: '2030-01-07', atualizacao: false, criadaEm: '2029-12-31T10:00:00Z' };
    jest.mocked(listarAvisosPlanos).mockResolvedValue([
      { ...plano, id: 4, atualizacao: true, criadaEm: '2029-12-31T11:00:00Z' }, plano
    ]);
    appointments.mockResolvedValue([]);
    const tree = await renderScreen();
    const textos = tree.root.findAllByType(Text).map(item => item.props.children);
    expect(textos).toEqual(expect.arrayContaining(['Novo plano alimentar', 'Plano alimentar atualizado', '01/01/2030 a 07/01/2030']));
    const botao = tree.root.findAllByProps({ accessibilityRole: 'button' })
      .find(item => item.props.accessibilityLabel?.includes('Abrir dieta'))!;
    await act(async () => botao.props.onPress());
    expect(navigation.navigate).toHaveBeenCalledWith('Dieta');
    expect(gravarVistas).toHaveBeenCalledWith(2, new Set(['plano:4', 'plano:3']));
    await act(async () => tree.unmount());
  });

  it('exibe o pedido e o parecer com destino para Exames', async () => {
    jest.mocked(listarAvisosExames).mockResolvedValue([
      { id: 3, tipo: 'PARECER_REGISTRADO', exameNome: 'Hemograma', criadaEm: '2029-12-31T11:00:00Z' },
      { id: 1, tipo: 'SOLICITADO', exameNome: 'Hemograma', criadaEm: '2029-12-30T11:00:00Z' }
    ]);
    appointments.mockResolvedValue([]);
    const tree = await renderScreen();
    const textos = tree.root.findAllByType(Text).map(item => item.props.children);
    expect(textos).toEqual(expect.arrayContaining(['Novo exame solicitado', 'Parecer de exame disponível', 'Hemograma']));
    const botao = tree.root.findAllByProps({ accessibilityRole: 'button' })
      .find(item => item.props.accessibilityLabel?.includes('Abrir exames'))!;
    await act(async () => botao.props.onPress());
    expect(navigation.navigate).toHaveBeenCalledWith('Exames');
    expect(gravarVistas).toHaveBeenCalledWith(2, new Set(['exame:3', 'exame:1']));
    await act(async () => tree.unmount());
  });
});
