import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppState } from 'react-native';

import { dataIsoDaClinica } from '../../../core/utils/date-mask.util';
import { useAtualizacaoDieta, useCargaVigente } from '../dieta.atualizacao';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (efeito: () => void) => jest.requireActual('react').useEffect(efeito, [efeito])
}));

it('recarrega na virada em São Paulo e ignora a resposta pendente do dia anterior', async () => {
  const estadoAnterior = AppState.currentState;
  AppState.currentState = 'active';
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-28T02:59:58Z'));
  const aplicar = jest.fn();
  let resolverAnterior!: (valor: string) => void;
  const anterior = new Promise<string>(resolve => { resolverAnterior = resolve; });
  const buscar = jest.fn().mockReturnValueOnce(anterior).mockResolvedValue('dieta nova');
  let manual!: () => void;

  function Tela() {
    const { executar } = useCargaVigente();
    const recarregar = React.useCallback(() => {
      void executar(dataIsoDaClinica(), async atual => {
        const dieta = await buscar();
        if (atual()) aplicar(dieta);
      });
    }, [executar]);
    manual = recarregar;
    useAtualizacaoDieta(recarregar);
    return null;
  }

  let tela: renderer.ReactTestRenderer | undefined;
  try {
    await act(async () => { tela = renderer.create(<Tela />); });
    await act(async () => { manual(); manual(); });
    expect(buscar).toHaveBeenCalledTimes(1);
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(buscar).toHaveBeenCalledTimes(2);
    await act(async () => { resolverAnterior('dieta antiga'); });
    expect(aplicar).toHaveBeenCalledTimes(1);
    expect(aplicar).toHaveBeenCalledWith('dieta nova');
  } finally {
    act(() => tela?.unmount());
    AppState.currentState = estadoAnterior;
    jest.useRealTimers();
  }
});
