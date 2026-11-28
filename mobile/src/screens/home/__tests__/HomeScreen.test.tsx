import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Switch, Text } from 'react-native';

import { toast } from '../../../components/feedback/toast';
import {
  atualizarPerfil,
  carregarPerfil,
  carregarLembretesConsulta,
  listarNutricionistas,
  salvarLembretesConsulta
} from '../../../core/perfil/perfil.service';
import { HomeScreen } from '../HomeScreen';

jest.mock('../../../core/perfil/perfil.service', () => ({
  atualizarPerfil: jest.fn(),
  carregarPerfil: jest.fn(),
  carregarLembretesConsulta: jest.fn(),
  desvincularNutricionista: jest.fn(),
  listarNutricionistas: jest.fn(),
  salvarLembretesConsulta: jest.fn(),
  listarSolicitacoesVinculo: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../core/auth/auth.service', () => ({ logout: jest.fn() }));
jest.mock('../../../components/feedback/toast', () => ({
  toast: { sucesso: jest.fn(), erro: jest.fn(), aviso: jest.fn(), informacao: jest.fn() }
}));
jest.mock('../../../components/layout/AppHeader', () => ({ AppHeader: () => null }));
jest.mock('../../../components/navigation/SideMenu', () => ({ SideMenu: () => null }));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (carregarPerfil as jest.Mock).mockResolvedValue({
      id: 1,
      nome: 'Paciente',
      email: 'paciente@example.com',
      telefone: null,
      sexo: null,
      dataNascimento: null
    });
    (listarNutricionistas as jest.Mock).mockResolvedValue([]);
    (atualizarPerfil as jest.Mock).mockResolvedValue({ nome: 'Paciente Atualizado' });
    jest.mocked(carregarLembretesConsulta).mockResolvedValue({ ativa: true });
  });

  it('desativa os lembretes e mantém a preferência quando uma tentativa de reativar falha', async () => {
    jest.mocked(salvarLembretesConsulta)
      .mockResolvedValueOnce({ ativa: false })
      .mockRejectedValueOnce(new Error('Falha de rede'));
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <HomeScreen navigation={{ navigate: jest.fn() } as never}
          route={{ key: 'DadosPessoais', name: 'DadosPessoais', params: undefined }} />
      );
    });
    const controle = () => tree.root.findByType(Switch);
    expect(controle().props.value).toBe(true);
    await act(async () => { controle().props.onValueChange(false); });
    expect(salvarLembretesConsulta).toHaveBeenCalledWith(false);
    expect(controle().props.value).toBe(false);
    await act(async () => { controle().props.onValueChange(true); });
    expect(controle().props.value).toBe(false);
    expect(toast.erro).toHaveBeenCalledWith('Não foi possível salvar a preferência. Tente novamente.');
    await act(async () => tree.unmount());
  });

  it('abre a tela existente de troca de senha a partir dos dados pessoais', async () => {
    const navigation = { navigate: jest.fn(), dispatch: jest.fn() };
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <HomeScreen navigation={navigation as never}
          route={{ key: 'DadosPessoais', name: 'DadosPessoais', params: undefined } as never} />
      );
    });
    const botao = tree!.root.findAll(item => typeof item.props.onPress === 'function'
      && item.findAllByType(Text).some(label => label.props.children === 'Trocar senha'))[0];
    await act(async () => { botao.props.onPress(); });
    expect(navigation.navigate).toHaveBeenCalledWith('TrocarSenha');
  }, 120000);

  it('limpa a confirmação anterior quando a validação seguinte falha', async () => {
    const navigation = { navigate: jest.fn(), dispatch: jest.fn() };
    let tree: renderer.ReactTestRenderer;
    const salvar = () =>
      tree!.root.findAll((item) =>
        typeof item.props.onPress === 'function' &&
        item.findAllByType(Text).some((label) => label.props.children === 'Salvar dados')
      )[0];

    await act(async () => {
      tree = renderer.create(
        <HomeScreen
          navigation={navigation as never}
          route={{ key: 'DadosPessoais', name: 'DadosPessoais', params: undefined } as never}
        />
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      tree!.root.findByProps({ accessibilityLabel: 'Nome' }).props.onChangeText('Paciente Atualizado');
    });

    await act(async () => {
      salvar().props.onPress();
    });

    expect(toast.sucesso).toHaveBeenCalledWith('Dados pessoais atualizados.');

    await act(async () => {
      tree!.root.findByProps({ accessibilityLabel: 'Nome' }).props.onChangeText('   ');
    });

    await act(async () => {
      salvar().props.onPress();
    });

    const renderedText = tree!.root.findAllByType(Text).map((item) => item.props.children).join(' ');
    expect(renderedText).toContain('Informe o nome.');
    expect(renderedText).not.toContain('Dados pessoais atualizados.');
    expect(toast.sucesso).toHaveBeenCalledTimes(1);
  }, 120000);
});
