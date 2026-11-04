import React from 'react';
import renderer, { act } from 'react-test-renderer';
import * as RN from 'react-native';
import { Pressable, ScrollView, Text } from 'react-native';

import {
  enviarResultadoExame,
  listarMeusExames,
  removerResultadoExame,
  selecionarArquivoDispositivo,
  validarArquivoExame
} from '../../../features/exames/exames.service';
import { ExamePedido } from '../../../features/exames/exames.models';
import { ExamesScreen } from '../ExamesScreen';

jest.mock('../../../features/exames/exames.service', () => {
  const actual = jest.requireActual('../../../features/exames/exames.service');
  return {
    ...actual,
    listarMeusExames: jest.fn(),
    enviarResultadoExame: jest.fn(),
    removerResultadoExame: jest.fn(),
    selecionarArquivoDispositivo: jest.fn()
  };
});

jest.mock('../../../core/auth/auth.service', () => ({
  logout: jest.fn()
}));

const mockHeaderMenuPress = (onOpenMenu?: () => void) => (
  <Pressable testID="mock-app-header-menu" onPress={onOpenMenu}>
    <Text>Abrir Menu</Text>
  </Pressable>
);

const mockSideMenuRender = (
  visible: boolean,
  onNavigate: (dest: string) => void
) => {
  if (!visible) return null;
  return (
    <Pressable testID="mock-side-menu-dashboard" onPress={() => onNavigate('home')}>
      <Text>Ir para Home</Text>
    </Pressable>
  );
};

jest.mock('../../../components/layout/AppHeader', () => ({
  AppHeader: ({ onOpenMenu }: { onOpenMenu?: () => void }) => mockHeaderMenuPress(onOpenMenu)
}));

jest.mock('../../../components/navigation/SideMenu', () => ({
  SideMenu: ({
    visible,
    onNavigate
  }: {
    visible: boolean;
    onNavigate: (dest: string) => void;
  }) => mockSideMenuRender(visible, onNavigate)
}));

function sampleExames(): ExamePedido[] {
  return [
    {
      id: 1,
      nome: 'Hemograma Completo',
      versao: 0, status: 'PENDENTE'
    },
    {
      id: 2,
      nome: 'Perfil Lipídico',
      versao: 1, status: 'ENVIADO',
      arquivoNome: 'resultado-perfil-lipidico.pdf'
    },
    {
      id: 3,
      nome: 'Glicemia de Jejum',
      versao: 0, status: 'PENDENTE'
    },
    {
      id: 4,
      nome: 'Vitamina D & B12',
      versao: 1, status: 'ENVIADO',
      arquivoNome: 'resultado-vitamina-d.pdf'
    }
  ];
}

function renderedText(tree: renderer.ReactTestRenderer): string {
  return tree.root
    .findAllByType(Text)
    .map((node) => {
      const children = node.props.children;
      return Array.isArray(children) ? children.join('') : String(children ?? '');
    })
    .join('\n');
}

describe('ExamesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('valida formatos permitidos (PDF, PNG e JPEG até 5 MiB) em validarArquivoExame', () => {
    expect(
      validarArquivoExame({
        nome: 'laudo-hemograma.pdf',
        tipo: 'application/pdf',
        tamanhoBytes: 512 * 1024
      })
    ).toBeNull();

    expect(
      validarArquivoExame({
        nome: 'foto-exame.png',
        tipo: 'image/png',
        tamanhoBytes: 1024 * 1024
      })
    ).toBeNull();

    expect(
      validarArquivoExame({
        nome: 'planilha.xlsx',
        tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        tamanhoBytes: 1024
      })
    ).toContain('Formato inválido');

    expect(
      validarArquivoExame({
        nome: 'laudo-pesado.pdf',
        tipo: 'application/pdf',
        tamanhoBytes: 15 * 1024 * 1024
      })
    ).toContain('até 5 MiB');
  });

  it('exibe a lista de pedidos de exames com status PENDENTE e ENVIADO conforme o Figma', async () => {
    (listarMeusExames as jest.Mock).mockResolvedValueOnce(sampleExames());
    const navigation = { navigate: jest.fn(), dispatch: jest.fn() };
    let tree!: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <ExamesScreen
          navigation={navigation as never}
          route={{ key: 'Exames', name: 'Exames', params: undefined } as never}
        />
      );
      await Promise.resolve();
    });

    const output = renderedText(tree);
    expect(output).toContain('Pedidos de Exames');
    expect(output).toContain('Envie seus resultados para análise nutricional personalizada.');
    expect(output).toContain('Hemograma Completo');
    expect(output).toContain('Perfil Lipídico');
    expect(output).toContain('Glicemia de Jejum');
    expect(output).toContain('Vitamina D & B12');
    expect(output).toContain('PENDENTE');
    expect(output).toContain('ENVIADO');

    act(() => tree.unmount());
  });

  it('bloqueia envio sem arquivo, rejeita formato inválido, permite remover seleção e confirma envio de PDF válido', async () => {
    (listarMeusExames as jest.Mock).mockResolvedValueOnce(sampleExames());
    (enviarResultadoExame as jest.Mock).mockResolvedValueOnce({
      id: 1,
      nome: 'Hemograma Completo',
      versao: 1, status: 'ENVIADO',
      arquivoNome: 'resultado-hemograma-completo.pdf'
    });
    const navigation = { navigate: jest.fn(), dispatch: jest.fn() };
    let tree!: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <ExamesScreen
          navigation={navigation as never}
          route={{ key: 'Exames', name: 'Exames', params: undefined } as never}
        />
      );
      await Promise.resolve();
    });

    const actionButton = tree.root.findByProps({ testID: 'exame-action-button-1' });
    await act(async () => {
      actionButton.props.onPress();
    });

    expect(renderedText(tree)).toContain('Enviar Resultado de Exame');
    expect(renderedText(tree)).toContain('Clique para selecionar');

    const confirmButton = tree.root.findByProps({ testID: 'exame-upload-confirm-button' });
    await act(async () => {
      await confirmButton.props.onPress();
    });
    expect(renderedText(tree)).toContain('Selecione um arquivo antes de confirmar o envio.');

    // Tenta selecionar um arquivo inválido (.txt)
    (selecionarArquivoDispositivo as jest.Mock).mockResolvedValueOnce({
      nome: 'anotacoes.txt',
      tipo: 'text/plain',
      tamanhoBytes: 1200
    });

    const selectArea = tree.root.findByProps({ testID: 'exame-upload-select-area' });
    await act(async () => {
      await selectArea.props.onPress();
    });

    expect(renderedText(tree)).toContain(
      'Formato inválido. Selecione PDF, PNG ou JPEG.'
    );

    // Seleciona um PDF válido do dispositivo
    (selecionarArquivoDispositivo as jest.Mock).mockResolvedValueOnce({
      nome: 'resultado-hemograma-completo.pdf',
      tipo: 'application/pdf',
      tamanhoBytes: 245760,
      uri: 'file:///resultado.pdf'
    });

    await act(async () => {
      await selectArea.props.onPress();
    });

    expect(renderedText(tree)).toContain('resultado-hemograma-completo.pdf');

    // Remove o arquivo selecionado antes de enviar
    const clearSelectedBtn = tree.root.findByProps({
      testID: 'exame-clear-selected-file-button'
    });
    await act(async () => {
      clearSelectedBtn.props.onPress();
    });

    expect(renderedText(tree)).not.toContain('resultado-hemograma-completo.pdf');

    // Seleciona novamente e confirma o envio
    (selecionarArquivoDispositivo as jest.Mock).mockResolvedValueOnce({
      nome: 'resultado-hemograma-completo.pdf',
      tipo: 'application/pdf',
      tamanhoBytes: 245760,
      uri: 'file:///resultado.pdf'
    });

    await act(async () => {
      await selectArea.props.onPress();
    });

    await act(async () => {
      await confirmButton.props.onPress();
    });

    expect(enviarResultadoExame).toHaveBeenCalledWith(1, {
      versao: 0,
      arquivo: { nome: 'resultado-hemograma-completo.pdf', tipo: 'application/pdf', tamanhoBytes: 245760, uri: 'file:///resultado.pdf' }
    });
    expect(renderedText(tree)).toContain(
      'Resultado de "Hemograma Completo" enviado com sucesso.'
    );

    const statusNode = tree.root.findByProps({ testID: 'exame-status-1' });
    expect(statusNode.props.children).toBe('ENVIADO');

    act(() => tree.unmount());
  });

  it('permite remover um resultado de exame já enviado voltando o status para PENDENTE', async () => {
    (listarMeusExames as jest.Mock).mockResolvedValueOnce(sampleExames());
    (removerResultadoExame as jest.Mock).mockResolvedValueOnce({
      id: 2,
      nome: 'Perfil Lipídico',
      versao: 0, status: 'PENDENTE',
      arquivoNome: null
    });
    const navigation = { navigate: jest.fn(), dispatch: jest.fn() };
    let tree!: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <ExamesScreen
          navigation={navigation as never}
          route={{ key: 'Exames', name: 'Exames', params: undefined } as never}
        />
      );
      await Promise.resolve();
    });

    const removeBtn = tree.root.findByProps({ testID: 'exame-remove-button-2' });
    await act(async () => {
      await removeBtn.props.onPress();
    });

    expect(removerResultadoExame).toHaveBeenCalledWith(2, 1);
    expect(renderedText(tree)).toContain(
      'Envio de "Perfil Lipídico" removido. O exame voltou para PENDENTE.'
    );

    const statusNode = tree.root.findByProps({ testID: 'exame-status-2' });
    expect(statusNode.props.children).toBe('PENDENTE');

    act(() => tree.unmount());
  });

  it('permite navegar pelo menu lateral para outros módulos', async () => {
    (listarMeusExames as jest.Mock).mockResolvedValueOnce([]);
    const navigation = { navigate: jest.fn(), dispatch: jest.fn() };
    let tree!: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <ExamesScreen
          navigation={navigation as never}
          route={{ key: 'Exames', name: 'Exames', params: undefined } as never}
        />
      );
      await Promise.resolve();
    });

    expect(renderedText(tree)).toContain('Nenhum pedido de exame');

    const openMenuBtn = tree.root.findByProps({ testID: 'mock-app-header-menu' });
    await act(async () => {
      openMenuBtn.props.onPress();
    });

    const navHomeBtn = tree.root.findByProps({ testID: 'mock-side-menu-dashboard' });
    await act(async () => {
      navHomeBtn.props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('Dashboard');

    act(() => tree.unmount());
  });

  it('adapta a largura máxima responsivamente entre viewport mobile (390px) e tablet/web (768px)', async () => {
    const spy = jest.spyOn(RN.Dimensions, 'get');
    const navigation = { navigate: jest.fn(), dispatch: jest.fn() };

    spy.mockReturnValue({ width: 390, height: 844, scale: 2, fontScale: 1 });
    (listarMeusExames as jest.Mock).mockResolvedValueOnce(sampleExames());
    let compactTree!: renderer.ReactTestRenderer;
    await act(async () => {
      compactTree = renderer.create(
        <ExamesScreen
          navigation={navigation as never}
          route={{ key: 'Exames', name: 'Exames', params: undefined } as never}
        />
      );
      await Promise.resolve();
    });
    const compactScroll = compactTree.root.findByType(ScrollView);
    expect(JSON.stringify(compactScroll.props.contentContainerStyle)).toContain('"maxWidth":448');
    act(() => compactTree.unmount());

    spy.mockReturnValue({ width: 768, height: 1024, scale: 2, fontScale: 1 });
    (listarMeusExames as jest.Mock).mockResolvedValueOnce(sampleExames());
    let wideTree!: renderer.ReactTestRenderer;
    await act(async () => {
      wideTree = renderer.create(
        <ExamesScreen
          navigation={navigation as never}
          route={{ key: 'Exames', name: 'Exames', params: undefined } as never}
        />
      );
      await Promise.resolve();
    });
    const wideScroll = wideTree.root.findByType(ScrollView);
    expect(JSON.stringify(wideScroll.props.contentContainerStyle)).toContain('"maxWidth":680');
    act(() => wideTree.unmount());

    spy.mockRestore();
  });
});
