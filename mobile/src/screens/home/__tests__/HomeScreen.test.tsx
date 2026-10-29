import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import {
  atualizarPerfil,
  carregarPerfil,
  listarNutricionistas
} from '../../../core/perfil/perfil.service';
import { HomeScreen } from '../HomeScreen';

jest.mock('../../../core/perfil/perfil.service', () => ({
  atualizarPerfil: jest.fn(),
  carregarPerfil: jest.fn(),
  desvincularNutricionista: jest.fn(),
  listarNutricionistas: jest.fn()
}));

jest.mock('../../../core/auth/auth.service', () => ({ logout: jest.fn() }));
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
  });

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

    expect(JSON.stringify(tree!.toJSON())).toContain('Dados pessoais atualizados.');

    await act(async () => {
      tree!.root.findByProps({ accessibilityLabel: 'Nome' }).props.onChangeText('   ');
    });

    await act(async () => {
      salvar().props.onPress();
    });

    const renderedText = tree!.root.findAllByType(Text).map((item) => item.props.children).join(' ');
    expect(renderedText).toContain('Informe o nome.');
    expect(renderedText).not.toContain('Dados pessoais atualizados.');
  }, 120000);
});
