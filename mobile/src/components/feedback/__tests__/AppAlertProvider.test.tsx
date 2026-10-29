import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert, Platform, Pressable, Text } from 'react-native';

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

  it('exibe o alerta no web e executa o callback ao acionar o botão', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const onContinue = jest.fn();
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <AppAlertProvider>
          <AlertTrigger onContinue={onContinue} />
        </AppAlertProvider>
      );
    });

    await act(async () => {
      tree!.root.findByProps({ testID: 'open-alert' }).props.onPress();
    });

    expect(tree!.root.findAllByType(Text).map((item) => item.props.children)).toContain(
      'Conta criada'
    );
    expect(tree!.root.findAllByType(Text).map((item) => item.props.children)).toContain(
      'A conta está pronta para uso.'
    );
    expect(
      tree!.root.findByProps({ accessibilityRole: 'alert' }).props.accessibilityLabel
    ).toBe('Conta criada. A conta está pronta para uso.');

    await act(async () => {
      tree!.root.findByProps({ accessibilityLabel: 'Continuar' }).props.onPress();
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('continua delegando os alertas nativos para Alert.alert', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const nativeAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onContinue = jest.fn();
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <AppAlertProvider>
          <AlertTrigger onContinue={onContinue} />
        </AppAlertProvider>
      );
    });

    await act(async () => {
      tree!.root.findByProps({ testID: 'open-alert' }).props.onPress();
    });

    expect(nativeAlert).toHaveBeenCalledWith('Conta criada', 'A conta está pronta para uso.', [
      { text: 'Continuar', onPress: onContinue }
    ]);
    expect(onContinue).not.toHaveBeenCalled();
  });
});
