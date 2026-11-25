import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Modal, Platform, Pressable, Text } from 'react-native';

import { AppAlertProvider, useAppAlert } from '../AppAlertProvider';

function AlertTrigger({ onContinue }: { onContinue: () => void }) {
  const { showAlert } = useAppAlert();

  return (
    <Pressable
      testID="open-alert"
      onPress={() =>
        showAlert('Conta criada', 'A conta está pronta para uso.', [
          { text: 'Continuar', onPress: onContinue }
        ])
      }
    >
      <Text>Abrir</Text>
    </Pressable>
  );
}

describe('AppAlertProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(['web', 'ios', 'android'] as const)('exibe o alerta padronizado em %s', async (plataforma) => {
    jest.replaceProperty(Platform, 'OS', plataforma);
    const onContinue = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <AppAlertProvider>
          <AlertTrigger onContinue={onContinue} />
        </AppAlertProvider>
      );
    });

    await act(async () => {
      tree.root.findByProps({ testID: 'open-alert' }).props.onPress();
    });

    const titulo = tree.root.findAllByType(Text).find((item) => item.props.children === 'Conta criada');
    const descricao = tree.root.findAllByType(Text).find((item) => item.props.children === 'A conta está pronta para uso.');
    const modal = tree.root.findByType(Modal);
    expect(modal.props['aria-labelledby']).toBe(titulo?.props.nativeID);
    expect(modal.props['aria-describedby']).toBe(descricao?.props.nativeID);

    await act(async () => {
      await tree.root.findByProps({ accessibilityLabel: 'Continuar' }).props.onPress();
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(tree.root.findAllByType(Modal)).toHaveLength(0);
    act(() => tree.unmount());
  });
});