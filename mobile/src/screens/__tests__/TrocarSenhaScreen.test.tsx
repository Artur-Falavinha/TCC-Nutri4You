import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text, View } from 'react-native';

import TrocarSenhaScreen from '../TrocarSenhaScreen';
import { getToken } from '../../core/auth/token-storage';
import { solicitarRecuperacaoSenha } from '../../core/auth/auth.service';
import { carregarPerfil } from '../../core/perfil/perfil.service';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockShowAlert = jest.fn();

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null
}));

jest.mock('@react-navigation/native', () => ({
  CommonActions: { reset: jest.fn((payload) => payload) },
  useNavigation: () => ({
    navigate: mockNavigate,
    dispatch: mockDispatch
  })
}));

jest.mock('../../components/feedback/AppAlertProvider', () => ({
  useAppAlert: () => ({
    showAlert: mockShowAlert
  })
}));

jest.mock('../../core/auth/token-storage', () => ({
  getToken: jest.fn()
}));

jest.mock('../../core/auth/auth.service', () => ({
  logout: jest.fn(),
  solicitarRecuperacaoSenha: jest.fn()
}));

jest.mock('../../core/perfil/perfil.service', () => ({
  carregarPerfil: jest.fn()
}));

jest.mock('../../components/layout/AppHeader', () => {
  const { View: MockView } = jest.requireActual('react-native');
  return {
    AppHeader: ({ onOpenMenu }: { onOpenMenu: () => void }) => (
      <MockView testID="app-header-menu-btn" onTouchEnd={onOpenMenu} />
    )
  };
});

jest.mock('../../components/navigation/SideMenu', () => {
  const { View: MockView } = jest.requireActual('react-native');
  return {
    SideMenu: ({ onNavigate }: { onNavigate: (destination: string) => void }) => (
      <MockView testID="side-menu-diet-btn" onTouchEnd={() => onNavigate('diet')} />
    )
  };
});

function renderedText(tree: renderer.ReactTestRenderer): string {
  return tree.root
    .findAllByType(Text)
    .map((node) => {
      const children = node.props.children;
      return Array.isArray(children) ? children.join('') : String(children ?? '');
    })
    .join('\n');
}

describe('TrocarSenhaScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite retornar ao login quando acessado sem sessão ativa e voltar da etapa 2 para a etapa 1', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce(null);
    (solicitarRecuperacaoSenha as jest.Mock).mockResolvedValueOnce('Instruções enviadas.');

    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<TrocarSenhaScreen />);
      await Promise.resolve();
    });

    const backButton = tree.root.findByProps({ testID: 'trocar-senha-back-button' });
    expect(renderedText(tree)).toContain('Voltar para o login');

    await act(async () => {
      backButton.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Login');

    const emailInput = tree.root.findByProps({ placeholder: 'email@exemplo.com' });
    await act(async () => {
      emailInput.props.onChangeText('paciente@nutri4you.com');
    });

    const submitButton = tree.root.findByProps({ testID: 'trocar-senha-submit-button' });
    await act(async () => {
      await submitButton.props.onPress();
    });

    const editEmailButton = tree.root.findByProps({ testID: 'trocar-senha-edit-email-button' });
    await act(async () => {
      editEmailButton.props.onPress();
    });

    expect(tree.root.findAllByProps({ testID: 'trocar-senha-edit-email-button' })).toHaveLength(0);
    expect(tree.root.findAllByType(View).length).toBeGreaterThan(0);
    act(() => tree.unmount());
  });

  it('exibe AppHeader, SideMenu e permite navegar para outros módulos quando o paciente está autenticado', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('jwt-token');
    (carregarPerfil as jest.Mock).mockResolvedValueOnce({
      id: 1,
      nome: 'Arthur Deretti',
      email: 'arthur@email.com'
    });

    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<TrocarSenhaScreen />);
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(renderedText(tree)).toContain('Voltar ao início');
    expect(tree.root.findAllByProps({ testID: 'app-header-menu-btn' }).length).toBeGreaterThan(0);

    const sideMenuDietBtn = tree.root.findByProps({ testID: 'side-menu-diet-btn' });
    await act(async () => {
      sideMenuDietBtn.props.onTouchEnd();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Dieta');

    const backButton = tree.root.findByProps({ testID: 'trocar-senha-back-button' });
    await act(async () => {
      backButton.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Dashboard');

    act(() => tree.unmount());
  });
});
